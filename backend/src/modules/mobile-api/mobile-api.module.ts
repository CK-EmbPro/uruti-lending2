import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MobileApiService } from './services/mobile-api.service';
import { MobileApiController } from './mobile-api.controller';
import { DeviceRegistration } from './entities/device-registration.entity';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeviceRegistration,
      Loan,
      LoanApplication,
      LoanRepayment,
    ]),
  ],
  controllers: [MobileApiController],
  providers: [MobileApiService],
  exports: [MobileApiService],
})
export class MobileApiModule {}

