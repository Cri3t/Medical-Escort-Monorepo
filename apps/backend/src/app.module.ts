import { Module } from '@nestjs/common';
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
    EscortProfileModule,
    OrdersModule,
  ],
})
export class AppModule {}
