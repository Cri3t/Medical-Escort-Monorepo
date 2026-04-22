import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { SafeUser } from '../../user/types/safe-user.type';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'medical-escort-dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<SafeUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('无效的登录凭证');
    }

    return this.userService.findSafeById(payload.sub);
  }
}

