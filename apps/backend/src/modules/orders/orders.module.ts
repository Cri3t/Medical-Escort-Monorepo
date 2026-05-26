import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'medical-escort-dev-secret',
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersGateway, OrdersService],
})
export class OrdersModule {}
