import { ConflictException, Injectable } from '@nestjs/common';
import { EscortProfile, Prisma } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class EscortProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async apply(userId: string, dto: CreateProfileDto): Promise<EscortProfile> {
    try {
      return await this.prisma.escortProfile.create({
        data: {
          userId,
          idCardNo: dto.idCardNo,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('您已提交过申请或该身份证已被注册');
      }

      throw error;
    }
  }
}
