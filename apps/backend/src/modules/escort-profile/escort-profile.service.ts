import { ConflictException, Injectable } from '@nestjs/common';
import { EscortProfile, EscortProfileStatus, Prisma } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class EscortProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string): Promise<EscortProfile | null> {
    return this.prisma.escortProfile.findUnique({
      where: { userId },
    });
  }

  async getPublicProfiles() {
    return this.prisma.escortProfile.findMany({
      where: {
        status: EscortProfileStatus.APPROVED,
        isVerified: true,
      },
      select: {
        id: true,
        userId: true,
        isVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async apply(userId: string, dto: CreateProfileDto): Promise<EscortProfile> {
    try {
      return await this.prisma.escortProfile.create({
        data: {
          userId,
          idCardNo: dto.idCardNo,
          status: EscortProfileStatus.PENDING,
          isVerified: false,
          rejectionReason: null,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already submitted an application or this ID card has been registered',
        );
      }

      throw error;
    }
  }
}
