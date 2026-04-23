import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EscortProfileController } from './escort-profile.controller';
import { EscortProfileService } from './escort-profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [EscortProfileController],
  providers: [EscortProfileService],
})
export class EscortProfileModule {}
