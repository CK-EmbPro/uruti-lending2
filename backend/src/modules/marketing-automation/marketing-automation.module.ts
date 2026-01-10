import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketingAutomationService } from './services/marketing-automation.service';
import { MarketingAutomationController } from './marketing-automation.controller';
import { MarketingCampaign } from './entities/marketing-campaign.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketingCampaign, LoanApplication, Loan]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [MarketingAutomationController],
  providers: [MarketingAutomationService],
  exports: [MarketingAutomationService],
})
export class MarketingAutomationModule {}

