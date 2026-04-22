import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthResult, AuthService } from './auth.service';
import { SafeUser } from '../user/types/safe-user.type';

@ApiTags('认证模块')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '注册新用户' })
  @ApiResponse({ status: 201, description: '成功' })
  @ApiResponse({ status: 400, description: '手机号或密码格式错误' })
  @ApiResponse({ status: 409, description: '手机号已存在' })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 201, description: '成功' })
  @ApiResponse({ status: 400, description: '手机号或密码格式错误' })
  @ApiResponse({ status: 401, description: '手机号或密码错误' })
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: SafeUser): SafeUser {
    return user;
  }
}
