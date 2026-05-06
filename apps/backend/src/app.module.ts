import { Module } from '@nestjs/common';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { EscortProfileModule } from './modules/escort-profile/escort-profile.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    AdminModule,
    EscortProfileModule,
    OrdersModule,
  ],
})
export class AppModule {}
