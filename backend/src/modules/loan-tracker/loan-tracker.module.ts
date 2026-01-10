import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { LoanTrackerGateway } from './gateways/loan-tracker.gateway';
import { LoanTrackerService } from './services/loan-tracker.service';
import { LoanTrackerController } from './loan-tracker.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
// import { EventEmitterModule } from '@nestjs/event-emitter'; // Commented out - install @nestjs/event-emitter if needed

@Module({
  imports: [
    TypeOrmModule.forFeature([Loan, LoanApplication]),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [LoanTrackerController],
  providers: [LoanTrackerGateway, LoanTrackerService],
  exports: [LoanTrackerService, LoanTrackerGateway],
})
export class LoanTrackerModule {}

