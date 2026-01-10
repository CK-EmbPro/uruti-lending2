import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './services/marketing.service';
import { Campaign } from './entities/campaign.entity';
import { PreApprovedOffer } from './entities/pre-approved-offer.entity';
import { CampaignResponse } from './entities/campaign-response.entity';
import { CrossSellOpportunity } from './entities/cross-sell-opportunity.entity';
import { Referral } from './entities/referral.entity';
import { ReferralBonus } from './entities/referral-bonus.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Campaign,
      PreApprovedOffer,
      CampaignResponse,
      CrossSellOpportunity,
      Referral,
      ReferralBonus,
      Loan,
      LoanApplication,
    ]),
  ],
  controllers: [MarketingController],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}














