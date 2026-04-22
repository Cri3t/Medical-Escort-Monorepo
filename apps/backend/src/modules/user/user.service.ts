import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { SafeUser } from './types/safe-user.type';

interface CreateUserInput {
  phone: string;
  password: string;
  nickname?: string;
  role?: UserRole;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<SafeUser> {
    try {
      const user = await this.prisma.user.create({
        data: {
          phone: input.phone,
          password: input.password,
          nickname: input.nickname,
          role: input.role ?? UserRole.USER,
        },
      });

      return this.toSafeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('手机号已注册');
      }

      throw error;
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findSafeById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.toSafeUser(user);
  }

  toSafeUser(user: User): SafeUser {
    const { password: _password, ...safeUser } = user;

    return safeUser;
  }
}

