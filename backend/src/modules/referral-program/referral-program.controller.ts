import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReferralProgramService } from './services/referral-program.service';
import { CreateReferralDto, GetReferralStatsDto } from './dto/referral-program.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('referral-program')
@ApiBearerAuth('JWT-auth')
@Controller('referral-program')
@UseGuards(CompanyGuard)
export class ReferralProgramController {
  constructor(private readonly referralService: ReferralProgramService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new referral',
    description: 'Creates a referral link for a customer to refer friends. Returns referral code and link.',
  })
  @ApiBody({ type: CreateReferralDto })
  @ApiResponse({
    status: 201,
    description: 'Referral created successfully',
  })
  async createReferral(
    @Body() dto: CreateReferralDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.referralService.createReferral(dto, companyId);
  }

  @Get('stats/:customerId')
  @ApiOperation({
    summary: 'Get referral statistics',
    description: 'Returns referral statistics for a customer including total referrals, rewards earned, and breakdown by status.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Referral statistics retrieved successfully',
  })
  async getReferralStats(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.referralService.getReferralStats({ customerId }, companyId);
  }

  @Get('code/:referralCode')
  @ApiOperation({
    summary: 'Get referral by code',
    description: 'Retrieves referral information by referral code.',
  })
  @ApiParam({ name: 'referralCode', description: 'Referral code' })
  @ApiResponse({
    status: 200,
    description: 'Referral retrieved successfully',
  })
  async getReferralByCode(
    @Param('referralCode') referralCode: string,
  ) {
    return await this.referralService.getReferralByCode(referralCode);
  }
}

