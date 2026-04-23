import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, UserRole } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeUser } from '../user/types/safe-user.type';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateOrderDto) {
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

    return this.prisma.order.create({
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
  }

  async getMyOrders(user: SafeUser) {
    if (user.role === UserRole.USER) {
      return this.prisma.order.findMany({
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
    }

    if (user.role === UserRole.ESCORT) {
      return this.prisma.order.findMany({
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
    }

    return [];
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
