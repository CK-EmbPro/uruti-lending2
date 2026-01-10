import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GamificationService } from './services/gamification.service';
import {
  AwardPointsDto,
  RedeemPointsDto,
  CreateReferralDto,
  CreateBadgeDto,
  CreateRewardDto,
  GetLeaderboardDto,
} from './dto/gamification.dto';

@ApiTags('gamification')
@ApiBearerAuth('JWT-auth')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('points/award')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Award points to customer' })
  @ApiResponse({ status: 201, description: 'Points awarded successfully' })
  awardPoints(@Body() dto: AwardPointsDto, @Request() req: any) {
    return this.gamificationService.awardPoints(dto, req.user?.id);
  }

  @Get('points/summary/:customerId')
  @ApiOperation({ summary: 'Get customer loyalty summary' })
  @ApiResponse({ status: 200, description: 'Loyalty summary retrieved' })
  getLoyaltySummary(@Param('customerId') customerId: string) {
    return this.gamificationService.getLoyaltySummary(customerId);
  }

  @Post('points/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem points for reward' })
  @ApiResponse({ status: 200, description: 'Points redeemed successfully' })
  redeemPoints(@Body() dto: RedeemPointsDto, @Request() req: any) {
    return this.gamificationService.redeemPoints(req.user?.id || req.body.customerId, dto);
  }

  @Get('badges/:customerId')
  @ApiOperation({ summary: 'Get customer badges' })
  @ApiResponse({ status: 200, description: 'Customer badges retrieved' })
  getCustomerBadges(@Param('customerId') customerId: string) {
    return this.gamificationService.getCustomerBadges(customerId);
  }

  @Post('referrals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create referral' })
  @ApiResponse({ status: 201, description: 'Referral created successfully' })
  createReferral(@Body() dto: CreateReferralDto, @Request() req: any) {
    return this.gamificationService.createReferral(req.user?.id || req.body.referrerId, dto);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  getLeaderboard(@Query() filters: GetLeaderboardDto) {
    return this.gamificationService.getLeaderboard(filters);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Get rewards catalog' })
  @ApiResponse({ status: 200, description: 'Rewards catalog retrieved' })
  getRewardsCatalog(@Query('tier') tier?: string) {
    return this.gamificationService.getRewardsCatalog(tier);
  }
}

