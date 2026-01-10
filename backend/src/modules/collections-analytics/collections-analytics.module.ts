import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionsAnalyticsService } from './services/collections-analytics.service';
import { CollectionsAnalyticsController } from './collections-analytics.controller';
import { CollectionAnalytics } from './entities/collection-analytics.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
// Customer entity doesn't exist - removed

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CollectionAnalytics,
      Loan,
      LoanRepayment,
      // Customer entity removed
    ]),
  ],
  controllers: [CollectionsAnalyticsController],
  providers: [CollectionsAnalyticsService],
  exports: [CollectionsAnalyticsService],
})
export class CollectionsAnalyticsModule {}

