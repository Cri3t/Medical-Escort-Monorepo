import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@medical-escort/database';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SafeUser } from '../user/types/safe-user.type';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';
import type { OrderListItem } from './types/order-list-item.type';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create an escort service order' })
  @ApiResponse({ status: 201, description: 'Success.' })
  @ApiResponse({ status: 400, description: 'Invalid escort user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @Post()
  @Roles(UserRole.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(
    @CurrentUser() user: SafeUser,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderListItem> {
    return this.ordersService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @Get('my')
  getMyOrders(@CurrentUser() user: SafeUser): Promise<OrderListItem[]> {
    return this.ordersService.getMyOrders(user);
  }

  @ApiOperation({ summary: 'Pay an order as the current patient' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: 'clx0000000000000000000000',
  })
  @ApiResponse({
    status: 201,
    description: 'Order status changed to PENDING_ACCEPT.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be paid in its current status.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @ApiResponse({
    status: 403,
    description: 'The current user cannot operate this order.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @Post(':id/pay')
  @Roles(UserRole.USER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  payOrder(
    @CurrentUser() user: SafeUser,
    @Param('id') orderId: string,
  ): Promise<OrderListItem> {
    return this.ordersService.payOrder(user.id, orderId);
  }

  @ApiOperation({ summary: 'Accept an assigned order as the current escort' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: 'clx0000000000000000000000',
  })
  @ApiResponse({
    status: 201,
    description: 'Order status changed to IN_SERVICE.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be accepted in its current status.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @ApiResponse({
    status: 403,
    description: 'The current escort cannot operate this order.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @Post(':id/accept')
  @Roles(UserRole.ESCORT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  acceptOrder(
    @CurrentUser() user: SafeUser,
    @Param('id') orderId: string,
  ): Promise<OrderListItem> {
    return this.ordersService.acceptOrder(user.id, orderId);
  }

  @ApiOperation({ summary: 'Complete an assigned order as the current escort' })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: 'clx0000000000000000000000',
  })
  @ApiResponse({
    status: 201,
    description: 'Order status changed to COMPLETED.',
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be completed in its current status.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @ApiResponse({
    status: 403,
    description: 'The current escort cannot operate this order.',
  })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @Post(':id/complete')
  @Roles(UserRole.ESCORT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  completeOrder(
    @CurrentUser() user: SafeUser,
    @Param('id') orderId: string,
  ): Promise<OrderListItem> {
    return this.ordersService.completeOrder(user.id, orderId);
  }
}
