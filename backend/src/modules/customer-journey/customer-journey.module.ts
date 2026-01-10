import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerJourneyService } from './services/customer-journey.service';
import { CustomerJourneyController } from './customer-journey.controller';
import { CustomerJourney } from './entities/customer-journey.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerJourney, LoanApplication, Loan])],
  controllers: [CustomerJourneyController],
  providers: [CustomerJourneyService],
  exports: [CustomerJourneyService],
})
export class CustomerJourneyModule {}

