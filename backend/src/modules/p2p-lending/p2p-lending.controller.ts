import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { P2PLendingService } from './services/p2p-lending.service';
import {
  CreateP2PListingDto,
  InvestInListingDto,
  P2PListingStatus,
} from './dto/p2p-lending.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('P2P Lending')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('p2p-lending')
export class P2PLendingController {
  constructor(private readonly p2pLendingService: P2PLendingService) {}

  @Post('listings')
  @ApiOperation({ summary: 'Create P2P listing' })
  @ApiResponse({ status: 201, description: 'P2P listing created successfully' })
  createListing(
    @Body() createDto: CreateP2PListingDto,
    @CurrentUser() user: any,
  ) {
    return this.p2pLendingService.createListing(createDto, user.id);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Get all P2P listings' })
  @ApiResponse({ status: 200, description: 'List of P2P listings' })
  findAllListings(@Request() req: any) {
    const status = req.query.status as P2PListingStatus;
    return this.p2pLendingService.findAllListings(status);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get P2P listing by ID' })
  @ApiResponse({ status: 200, description: 'P2P listing details' })
  findOneListing(@Param('id') id: string) {
    return this.p2pLendingService.findOneListing(id);
  }

  @Post('invest')
  @ApiOperation({ summary: 'Invest in P2P listing' })
  @ApiResponse({ status: 201, description: 'Investment created successfully' })
  investInListing(
    @Request() req: any,
    @Body() investDto: InvestInListingDto,
  ) {
    const investorId = req.user.investorId || req.user.id;
    return this.p2pLendingService.investInListing(investorId, investDto);
  }

  @Get('investments')
  @ApiOperation({ summary: 'Get investor investments' })
  @ApiResponse({ status: 200, description: 'List of investments' })
  getInvestorInvestments(@Request() req: any) {
    const investorId = req.user.investorId || req.user.id;
    return this.p2pLendingService.getInvestorInvestments(investorId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get investor dashboard' })
  @ApiResponse({ status: 200, description: 'Investor dashboard data' })
  getInvestorDashboard(@Request() req: any) {
    const investorId = req.user.investorId || req.user.id;
    return this.p2pLendingService.getInvestorDashboard(investorId);
  }

  @Patch('investments/:id/confirm')
  @ApiOperation({ summary: 'Confirm investment' })
  @ApiResponse({ status: 200, description: 'Investment confirmed' })
  confirmInvestment(@Param('id') id: string) {
    return this.p2pLendingService.confirmInvestment(id);
  }
}

