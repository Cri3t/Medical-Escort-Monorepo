import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeUser } from '../user/types/safe-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderByUserDto } from './dto/update-order-by-user.dto';
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

  async payOrder(userId: string, orderId: string): Promise<OrderListItem> {
    const order = await this.findOrderOrThrow(orderId);

    if (order.customerId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('订单当前状态无法支付');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING_ACCEPT,
      },
    });

    return this.toOrderListItem(updatedOrder);
  }

  async userUpdateOrder(
    userId: string,
    orderId: string,
    dto: UpdateOrderByUserDto,
  ): Promise<OrderListItem> {
    const hasRemark = Object.prototype.hasOwnProperty.call(dto, 'remark');
    const hasAmount = Object.prototype.hasOwnProperty.call(dto, 'amount');

    if (!hasRemark && !hasAmount) {
      throw new BadRequestException('请至少提交一个要修改的字段');
    }

    const order = await this.findOrderOrThrow(orderId);

    if (order.customerId !== userId) {
      throw new ForbiddenException('无权操作此订单');
    }

    const remarkEditableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PENDING_ACCEPT,
    ];

    if (hasRemark && !remarkEditableStatuses.includes(order.status)) {
      throw new BadRequestException('当前订单状态不允许修改备注');
    }

    if (hasAmount && order.status !== OrderStatus.PENDING_ACCEPT) {
      throw new BadRequestException('当前订单状态不允许修改金额');
    }

    const updateData: {
      remark?: string | null;
      amount?: number;
    } = {};

    if (hasRemark) {
      const remark = typeof dto.remark === 'string' ? dto.remark.trim() : '';
      updateData.remark = remark || null;
    }

    if (hasAmount) {
      updateData.amount = dto.amount;
    }

    const allowedStatuses = hasAmount
      ? [OrderStatus.PENDING_ACCEPT]
      : [OrderStatus.PENDING_PAYMENT, OrderStatus.PENDING_ACCEPT];
    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        customerId: userId,
        status: {
          in: allowedStatuses,
        },
      },
      data: updateData,
    });

    if (result.count === 0) {
      throw new BadRequestException('订单状态已变更，请刷新后重试');
    }

    const updatedOrder = await this.findOrderOrThrow(orderId);

    return this.toOrderListItem(updatedOrder);
  }

  async acceptOrder(escortId: string, orderId: string): Promise<OrderListItem> {
    const order = await this.findOrderOrThrow(orderId);

    if (order.escortId !== escortId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== OrderStatus.PENDING_ACCEPT) {
      throw new BadRequestException('订单当前状态无法接单');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.IN_SERVICE,
      },
    });

    return this.toOrderListItem(updatedOrder);
  }

  async completeOrder(escortId: string, orderId: string): Promise<OrderListItem> {
    const order = await this.findOrderOrThrow(orderId);

    if (order.escortId !== escortId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== OrderStatus.IN_SERVICE) {
      throw new BadRequestException('订单当前状态无法完成');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED,
      },
    });

    return this.toOrderListItem(updatedOrder);
  }

  async rejectOrder(escortId: string, orderId: string): Promise<OrderListItem> {
    const order = await this.findOrderOrThrow(orderId);

    if (order.escortId !== escortId) {
      throw new ForbiddenException('无权操作此订单');
    }

    if (order.status !== OrderStatus.PENDING_ACCEPT) {
      throw new BadRequestException('当前订单状态不允许拒绝接单');
    }

    const result = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        escortId,
        status: OrderStatus.PENDING_ACCEPT,
      },
      data: {
        escortId: null,
        status: OrderStatus.PENDING_ACCEPT,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('订单状态已变更，请刷新后重试');
    }

    const updatedOrder = await this.findOrderOrThrow(orderId);

    return this.toOrderListItem(updatedOrder);
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

  private async findOrderOrThrow(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
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
