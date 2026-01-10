import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvancedSearchService } from './services/advanced-search.service';
import { AdvancedSearchController } from './advanced-search.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Loan, LoanApplication])],
  controllers: [AdvancedSearchController],
  providers: [AdvancedSearchService],
  exports: [AdvancedSearchService],
})
export class AdvancedSearchModule {}

