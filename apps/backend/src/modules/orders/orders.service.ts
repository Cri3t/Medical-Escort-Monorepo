import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, UserRole } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeUser } from '../user/types/safe-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import type { OrderListItem, OrderParticipant } from './types/order-list-item.type';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<OrderListItem> {
    const escort = await this.prisma.user.findUnique({
      where: { id: dto.escortId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!escort || escort.role !== UserRole.ESCORT) {
      throw new BadRequestException('Escort does not exist or is not available');
    }

    const orderNo = await this.generateOrderNo();

    const order = await this.prisma.order.create({
      data: {
        customerId,
        escortId: dto.escortId,
        orderNo,
        hospitalName: dto.hospitalName,
        serviceAt: dto.serviceAt,
        remark: dto.remark,
        amount: dto.amount,
        status: OrderStatus.PENDING_PAYMENT,
      },
    });

    return this.toOrderListItem(order);
  }

  async getMyOrders(user: SafeUser): Promise<OrderListItem[]> {
    if (user.role === UserRole.USER) {
      const orders = await this.prisma.order.findMany({
        where: { customerId: user.id },
        include: {
          escort: {
            select: {
              nickname: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return orders.map((order) => this.toOrderListItem(order));
    }

    if (user.role === UserRole.ESCORT) {
      const orders = await this.prisma.order.findMany({
        where: { escortId: user.id },
        include: {
          customer: {
            select: {
              nickname: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return orders.map((order) => this.toOrderListItem(order));
    }

    return [];
  }

  private toOrderListItem(order: {
    id: string;
    customerId: string;
    escortId: string | null;
    orderNo: string;
    hospitalName: string;
    serviceAt: Date;
    remark: string | null;
    amount: { toNumber(): number };
    status: OrderStatus;
    createdAt: Date;
    updatedAt: Date;
    escort?: OrderParticipant | null;
    customer?: OrderParticipant;
  }): OrderListItem {
    return {
      ...order,
      amount: order.amount.toNumber(),
    };
  }

  private async generateOrderNo(): Promise<string> {
    let orderNo = this.createOrderNo();

    while (await this.prisma.order.findUnique({ where: { orderNo } })) {
      orderNo = this.createOrderNo();
    }

    return orderNo;
  }

  private createOrderNo(): string {
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      this.pad2(now.getMonth() + 1),
      this.pad2(now.getDate()),
      this.pad2(now.getHours()),
      this.pad2(now.getMinutes()),
      this.pad2(now.getSeconds()),
    ].join('');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `ORD${timestamp}${random}`;
  }

  private pad2(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
