import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@medical-escort/database';
import {
  ApiBearerAuth,
  ApiOperation,
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
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @Get('my')
  getMyOrders(@CurrentUser() user: SafeUser) {
    return this.ordersService.getMyOrders(user);
  }
}
