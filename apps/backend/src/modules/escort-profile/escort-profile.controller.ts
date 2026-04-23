import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SafeUser } from '../user/types/safe-user.type';
import { CreateProfileDto } from './dto/create-profile.dto';
import { EscortProfileService } from './escort-profile.service';

@ApiBearerAuth()
@ApiTags('Profile - 陪诊员入驻')
@Controller('escort-profile')
export class EscortProfileController {
  constructor(private readonly escortProfileService: EscortProfileService) {}

  @ApiOperation({ summary: '提交陪诊员实名认证申请' })
  @ApiResponse({ status: 201, description: '成功' })
  @ApiResponse({ status: 401, description: '未登录或登录已过期' })
  @ApiResponse({ status: 409, description: '已提交过申请或身份证已被注册' })
  @UseGuards(JwtAuthGuard)
  @Post('apply')
  apply(@CurrentUser() user: SafeUser, @Body() dto: CreateProfileDto) {
    return this.escortProfileService.apply(user.id, dto);
  }
}
