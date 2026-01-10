import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanSecurity } from '../loan-security/entities/loan-security.entity';
import { LoanSecurityAssignment } from '../loan-security-assignment/entities/loan-security-assignment.entity';
import { ConcentrationRisk } from './entities/concentration-risk.entity';
import { StressTest } from './entities/stress-test.entity';
import { EarlyWarningSignal } from './entities/early-warning-signal.entity';
import { CollateralRevaluation } from './entities/collateral-revaluation.entity';
import { RiskManagementService } from './services/risk-management.service';
import { RiskManagementController } from './risk-management.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Loan,
      LoanRepayment,
      LoanSecurity,
      LoanSecurityAssignment,
      ConcentrationRisk,
      StressTest,
      EarlyWarningSignal,
      CollateralRevaluation,
    ]),
  ],
  controllers: [RiskManagementController],
  providers: [RiskManagementService],
  exports: [RiskManagementService],
})
export class RiskManagementModule {}

