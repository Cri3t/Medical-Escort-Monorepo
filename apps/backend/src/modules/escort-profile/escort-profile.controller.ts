import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { SafeUser } from "../user/types/safe-user.type";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { EscortProfileService } from "./escort-profile.service";

@ApiBearerAuth()
@ApiTags("Profile - Escort Onboarding")
@Controller("escort-profile")
@UseGuards(JwtAuthGuard)
export class EscortProfileController {
  constructor(private readonly escortProfileService: EscortProfileService) {}

  @ApiOperation({
    summary: "Get current user's escort onboarding application",
  })
  @ApiResponse({
    status: 200,
    description: "Success. Returns null if no application exists.",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized or login expired.",
  })
  @Get("my")
  getMyProfile(@CurrentUser() user: SafeUser) {
    return this.escortProfileService.getMyProfile(user.id);
  }

  @ApiOperation({
    summary: "Submit escort identity verification application",
  })
  @ApiResponse({ status: 201, description: "Success." })
  @ApiResponse({
    status: 401,
    description: "Unauthorized or login expired.",
  })
  @ApiResponse({
    status: 409,
    description:
      "An application has already been submitted or the ID card has been registered.",
  })
  @Post("apply")
  apply(@CurrentUser() user: SafeUser, @Body() dto: CreateProfileDto) {
    return this.escortProfileService.apply(user.id, dto);
  }
}
