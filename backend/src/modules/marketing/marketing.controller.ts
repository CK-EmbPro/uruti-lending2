import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarketingService } from './services/marketing.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  LaunchCampaignDto,
  QueryCampaignsDto,
} from './dto/campaign.dto';
import {
  GenerateOffersDto,
  SendOfferDto,
  TrackOfferResponseDto,
  AcceptOfferDto,
  DeclineOfferDto,
  QueryOffersDto,
} from './dto/pre-approved-offer.dto';
import {
  IdentifyOpportunitiesDto,
  AssignOpportunityDto,
  ContactCustomerDto,
  PresentOfferDto,
  UpdateOpportunityStatusDto,
  QueryOpportunitiesDto,
} from './dto/cross-sell-opportunity.dto';
import {
  CreateReferralDto,
  UpdateReferralStatusDto,
  CreditReferralBonusDto,
  QueryReferralsDto,
  QueryReferralBonusesDto,
  UpdateReferralBonusStatusDto,
} from './dto/referral.dto';

@ApiTags('marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(
    private readonly marketingService: MarketingService,
  ) {}

  /**
   * UC-058: Pre-Approved Offer Campaign
   */

  @Post('campaigns')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create campaign',
    description: 'Creates a new marketing campaign',
  })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async createCampaign(@Body() dto: CreateCampaignDto, @Request() req: any) {
    return this.marketingService.createCampaign(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('campaigns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get campaigns',
    description: 'Retrieves campaigns with optional filters',
  })
  async getCampaigns(@Query() filters: QueryCampaignsDto) {
    return this.marketingService.getCampaigns(filters);
  }

  @Get('campaigns/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get campaign',
    description: 'Retrieves a specific campaign by ID',
  })
  async getCampaign(@Param('id') id: string) {
    return this.marketingService.getCampaign(id);
  }

  @Put('campaigns/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update campaign',
    description: 'Updates campaign information',
  })
  async updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @Request() req: any,
  ) {
    // Update campaign - simplified for now
    const campaign = await this.marketingService.getCampaign(id);
    if (dto.campaignName) campaign.campaignName = dto.campaignName;
    if (dto.status) campaign.status = dto.status;
    if (dto.targetCriteria) campaign.targetCriteria = dto.targetCriteria;
    if (dto.startDate) campaign.startDate = new Date(dto.startDate);
    if (dto.endDate) campaign.endDate = new Date(dto.endDate);
    if (dto.remarks) campaign.remarks = dto.remarks;
    // Return updated campaign (save would be in service method)
    return campaign;
  }

  @Post('campaigns/:id/launch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Launch campaign',
    description: 'Launches a campaign and generates offers',
  })
  async launchCampaign(
    @Param('id') id: string,
    @Body() dto: LaunchCampaignDto,
    @Request() req: any,
  ) {
    // Launch campaign and generate offers
    const campaign = await this.marketingService.getCampaign(id);
    const offers = await this.marketingService.generatePreApprovedOffers(
      { campaignId: id },
      req.user.id,
      req.user.name || req.user.email,
    );
    return { campaign, offers };
  }

  @Post('campaigns/:id/generate-offers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate pre-approved offers',
    description: 'Generates pre-approved offers for eligible customers',
  })
  async generateOffers(
    @Param('id') id: string,
    @Body() dto: GenerateOffersDto,
    @Request() req: any,
  ) {
    return this.marketingService.generatePreApprovedOffers(
      { ...dto, campaignId: id },
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('campaigns/:id/calculate-roi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate campaign ROI',
    description: 'Calculates return on investment for a campaign',
  })
  async calculateROI(@Param('id') id: string) {
    return this.marketingService.calculateCampaignROI(id);
  }

  @Get('offers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get pre-approved offers',
    description: 'Retrieves pre-approved offers with optional filters',
  })
  async getOffers(@Query() filters: QueryOffersDto) {
    return this.marketingService.getOffers(filters);
  }

  @Get('offers/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get offer',
    description: 'Retrieves a specific offer by ID',
  })
  async getOffer(@Param('id') id: string) {
    return this.marketingService.getOffer(id);
  }

  @Post('offers/:id/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send offer',
    description: 'Sends a pre-approved offer to the customer',
  })
  async sendOffer(
    @Param('id') id: string,
    @Body() dto: SendOfferDto,
    @Request() req: any,
  ) {
    return this.marketingService.sendOffer(
      { ...dto, offerId: id },
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('offers/:id/track-response')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track offer response',
    description: 'Tracks customer response to an offer',
  })
  async trackOfferResponse(
    @Param('id') id: string,
    @Body() dto: TrackOfferResponseDto,
    @Request() req: any,
  ) {
    return this.marketingService.trackOfferResponse(
      { ...dto, offerId: id },
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('offers/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept offer',
    description: 'Marks an offer as accepted by the customer',
  })
  async acceptOffer(
    @Param('id') id: string,
    @Body() dto: AcceptOfferDto,
    @Request() req: any,
  ) {
    return this.marketingService.acceptOffer(id, dto, req.user.id, req.user.name || req.user.email);
  }

  @Post('offers/:id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline offer',
    description: 'Marks an offer as declined by the customer',
  })
  async declineOffer(
    @Param('id') id: string,
    @Body() dto: DeclineOfferDto,
    @Request() req: any,
  ) {
    return this.marketingService.declineOffer(id, dto, req.user.id, req.user.name || req.user.email);
  }

  @Post('offers/:id/convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Convert offer',
    description: 'Marks an offer as converted to a loan application',
  })
  async convertOffer(
    @Param('id') id: string,
    @Body('applicationId') applicationId: string,
    @Request() req: any,
  ) {
    return this.marketingService.convertOffer(id, applicationId, req.user.id, req.user.name || req.user.email);
  }

  /**
   * UC-059: Cross-Sell Opportunity Identification
   */

  @Post('opportunities/identify')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Identify opportunities',
    description: 'Identifies cross-sell opportunities based on customer behavior',
  })
  @ApiResponse({ status: 201, description: 'Opportunities identified successfully' })
  async identifyOpportunities(@Body() dto: IdentifyOpportunitiesDto, @Request() req: any) {
    return this.marketingService.identifyOpportunities(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('opportunities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get opportunities',
    description: 'Retrieves cross-sell opportunities with optional filters',
  })
  async getOpportunities(@Query() filters: QueryOpportunitiesDto) {
    return this.marketingService.getOpportunities(filters);
  }

  @Get('opportunities/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get opportunity',
    description: 'Retrieves a specific opportunity by ID',
  })
  async getOpportunity(@Param('id') id: string) {
    return this.marketingService.getOpportunity(id);
  }

  @Post('opportunities/:id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign opportunity',
    description: 'Assigns an opportunity to a relationship manager',
  })
  async assignOpportunity(
    @Param('id') id: string,
    @Body() dto: AssignOpportunityDto,
    @Request() req: any,
  ) {
    return this.marketingService.assignOpportunity(id, dto, req.user.id, req.user.name || req.user.email);
  }

  @Post('opportunities/:id/contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Contact customer',
    description: 'Records customer contact for an opportunity',
  })
  async contactCustomer(
    @Param('id') id: string,
    @Body() dto: ContactCustomerDto,
    @Request() req: any,
  ) {
    return this.marketingService.contactCustomer(id, dto, req.user.id, req.user.name || req.user.email);
  }

  @Post('opportunities/:id/present-offer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Present offer',
    description: 'Records that an offer was presented to the customer',
  })
  async presentOffer(
    @Param('id') id: string,
    @Body() dto: PresentOfferDto,
    @Request() req: any,
  ) {
    return this.marketingService.presentOffer(id, dto, req.user.id, req.user.name || req.user.email);
  }

  @Put('opportunities/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update opportunity status',
    description: 'Updates the status of an opportunity',
  })
  async updateOpportunityStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityStatusDto,
    @Request() req: any,
  ) {
    return this.marketingService.updateOpportunityStatus(id, dto, req.user.id, req.user.name || req.user.email);
  }

  /**
   * UC-060: Referral Program Management
   */

  @Post('referrals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create referral',
    description: 'Creates a new referral record',
  })
  @ApiResponse({ status: 201, description: 'Referral created successfully' })
  async createReferral(@Body() dto: CreateReferralDto, @Request() req: any) {
    return this.marketingService.createReferral(dto, req.user.id, req.user.name || req.user.email);
  }

  @Get('referrals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referrals',
    description: 'Retrieves referrals with optional filters',
  })
  async getReferrals(@Query() filters: QueryReferralsDto) {
    return this.marketingService.getReferrals(filters);
  }

  @Get('referrals/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referral',
    description: 'Retrieves a specific referral by ID',
  })
  async getReferral(@Param('id') id: string) {
    return this.marketingService.getReferral(id);
  }

  @Put('referrals/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update referral status',
    description: 'Updates the status of a referral',
  })
  async updateReferralStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReferralStatusDto,
    @Request() req: any,
  ) {
    return this.marketingService.updateReferralStatus(id, dto, req.user.id, req.user.name || req.user.email);
  }

  @Post('referrals/:id/credit-bonus')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Credit referral bonus',
    description: 'Credits a bonus to the referrer',
  })
  async creditReferralBonus(
    @Param('id') id: string,
    @Body() dto: CreditReferralBonusDto,
    @Request() req: any,
  ) {
    return this.marketingService.creditReferralBonus(id, dto, req.user.id, req.user.name || req.user.email);
  }

  /**
   * Referral Bonus Management Endpoints
   */

  @Get('referrals/:referralId/bonuses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referral bonuses',
    description: 'Retrieves bonuses for a specific referral',
  })
  async getReferralBonuses(
    @Param('referralId') referralId: string,
    @Query() filters: QueryReferralBonusesDto,
  ) {
    return this.marketingService.getReferralBonuses({ ...filters, referralId });
  }

  @Get('bonuses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all referral bonuses',
    description: 'Retrieves all referral bonuses with optional filters',
  })
  async getAllReferralBonuses(@Query() filters: QueryReferralBonusesDto) {
    return this.marketingService.getReferralBonuses(filters);
  }

  @Get('bonuses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get referral bonus',
    description: 'Retrieves a specific referral bonus by ID',
  })
  async getReferralBonus(@Param('id') id: string) {
    return this.marketingService.getReferralBonus(id);
  }

  @Put('bonuses/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update referral bonus status',
    description: 'Updates the status of a referral bonus (Pending, Approved, Credited, Cancelled)',
  })
  async updateReferralBonusStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReferralBonusStatusDto,
    @Request() req: any,
  ) {
    return this.marketingService.updateReferralBonusStatus(id, dto, req.user.id, req.user.name || req.user.email);
  }
}

