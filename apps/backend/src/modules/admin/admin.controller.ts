import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@medical-escort/database';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminService } from './admin.service';
import { PendingEscortProfilesQueryDto } from './dto/pending-escort-profiles-query.dto';
import { ReviewEscortProfileDto } from './dto/review-escort-profile.dto';

@ApiBearerAuth()
@ApiTags('Admin - Escort Profile Reviews')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: '获取待审核陪诊员申请列表' })
  @ApiResponse({ status: 200, description: 'Success.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @ApiResponse({ status: 403, description: 'Admin role required.' })
  @Get('escort-profiles/pending')
  getPendingEscortProfiles(@Query() query: PendingEscortProfilesQueryDto) {
    return this.adminService.getPendingEscortProfiles(query);
  }

  @ApiOperation({ summary: '审核陪诊员申请' })
  @ApiParam({
    name: 'profileId',
    description: 'EscortProfile ID',
    example: 'clx0000000000000000000000',
  })
  @ApiResponse({ status: 201, description: 'Review submitted.' })
  @ApiResponse({ status: 400, description: 'Profile is not pending or body invalid.' })
  @ApiResponse({ status: 401, description: 'Unauthorized or login expired.' })
  @ApiResponse({ status: 403, description: 'Admin role required.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  @Post('escort-profiles/:profileId/review')
  reviewEscortProfile(
    @Param('profileId') profileId: string,
    @Body() dto: ReviewEscortProfileDto,
  ) {
    return this.adminService.reviewEscortProfile(profileId, dto);
  }
}
