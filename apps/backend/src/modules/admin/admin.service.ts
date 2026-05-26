import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EscortProfileStatus, UserRole } from '@medical-escort/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { PendingEscortProfilesQueryDto } from './dto/pending-escort-profiles-query.dto';
import {
  ReviewEscortProfileAction,
  ReviewEscortProfileDto,
} from './dto/review-escort-profile.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrders(query: AdminOrdersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const where = query.status ? { status: query.status } : undefined;

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNo: true,
          customerId: true,
          escortId: true,
          hospitalName: true,
          serviceAt: true,
          remark: true,
          amount: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              nickname: true,
              phone: true,
            },
          },
          escort: {
            select: {
              id: true,
              nickname: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      list: orders.map((order) => ({
        ...order,
        amount: order.amount.toNumber(),
      })),
      total,
      page,
      pageSize,
    };
  }

  async getPendingEscortProfiles(query: PendingEscortProfilesQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.prisma.$transaction([
      this.prisma.escortProfile.findMany({
        where: {
          status: EscortProfileStatus.PENDING,
        },
        select: {
          id: true,
          userId: true,
          idCardNo: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              nickname: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: pageSize,
      }),
      this.prisma.escortProfile.count({
        where: {
          status: EscortProfileStatus.PENDING,
        },
      }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async reviewEscortProfile(profileId: string, dto: ReviewEscortProfileDto) {
    const profile = await this.prisma.escortProfile.findUnique({
      where: {
        id: profileId,
      },
      select: {
        id: true,
        userId: true,
        status: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('陪诊员申请不存在');
    }

    if (profile.status !== EscortProfileStatus.PENDING) {
      throw new BadRequestException('只能审核待审核的陪诊员申请');
    }

    if (dto.action === ReviewEscortProfileAction.APPROVE) {
      return this.prisma.$transaction(async (tx) => {
        const result = await tx.escortProfile.updateMany({
          where: {
            id: profileId,
            status: EscortProfileStatus.PENDING,
          },
          data: {
            status: EscortProfileStatus.APPROVED,
            isVerified: true,
            rejectionReason: null,
          },
        });

        if (result.count === 0) {
          throw new BadRequestException('只能审核待审核的陪诊员申请');
        }

        await tx.user.update({
          where: {
            id: profile.userId,
          },
          data: {
            role: UserRole.ESCORT,
          },
        });

        return tx.escortProfile.findUniqueOrThrow({
          where: {
            id: profileId,
          },
        });
      });
    }

    const reason = dto.reason?.trim();

    const result = await this.prisma.escortProfile.updateMany({
      where: {
        id: profileId,
        status: EscortProfileStatus.PENDING,
      },
      data: {
        status: EscortProfileStatus.REJECTED,
        isVerified: false,
        rejectionReason: reason,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('只能审核待审核的陪诊员申请');
    }

    return this.prisma.escortProfile.findUniqueOrThrow({
      where: {
        id: profileId,
      },
    });
  }
}
