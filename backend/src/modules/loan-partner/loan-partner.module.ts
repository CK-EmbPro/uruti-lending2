import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanPartnerService } from './loan-partner.service';
import { LoanPartnerController } from './loan-partner.controller';
import { LoanPartner } from './entities/loan-partner.entity';
import { LoanPartnerShareable } from './entities/loan-partner-shareable.entity';
import { PartnerShareCalculationService } from './services/partner-share-calculation.service';
import { FldgTriggerService } from './services/fldg-trigger.service';
import { AccountingModule } from '../accounting/accounting.module';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanPartner, LoanPartnerShareable, Loan]),
    forwardRef(() => AccountingModule),
  ],
  controllers: [LoanPartnerController],
  providers: [
    LoanPartnerService,
    PartnerShareCalculationService,
    FldgTriggerService,
  ],
  exports: [
    LoanPartnerService,
    PartnerShareCalculationService,
    FldgTriggerService,
  ],
})
export class LoanPartnerModule {}

