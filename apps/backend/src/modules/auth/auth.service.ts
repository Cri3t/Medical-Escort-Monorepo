import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@medical-escort/database';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { SafeUser } from '../user/types/safe-user.type';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';

export interface AuthResult {
  accessToken: string;
  user: SafeUser;
}

@Injectable()
export class AuthService {
  private readonly passwordSaltRounds = 10;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    this.validatePhoneAndPassword(dto.phone, dto.password);

    if (dto.role && !Object.values(UserRole).includes(dto.role)) {
      throw new BadRequestException('用户角色不合法');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.passwordSaltRounds);
    const nickname =
      dto.nickname?.trim() ||
      `用户_${dto.phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')}`;
    const user = await this.userService.create({
      phone: dto.phone,
      password: passwordHash,
      nickname,
      role: dto.role,
    });

    return {
      accessToken: await this.signToken(user),
      user,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    this.validatePhoneAndPassword(dto.phone, dto.password);

    const user = await this.userService.findByPhone(dto.phone);

    if (!user) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const isPasswordMatched = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('手机号或密码错误');
    }

    const safeUser = this.userService.toSafeUser(user);

    return {
      accessToken: await this.signToken(safeUser),
      user: safeUser,
    };
  }

  private async signToken(user: SafeUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  private validatePhoneAndPassword(phone?: string, password?: string): void {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      throw new BadRequestException('请输入正确的手机号');
    }

    if (!password || password.length < 6 || password.length > 32) {
      throw new BadRequestException('密码长度必须为 6-32 位');
    }
  }
}
