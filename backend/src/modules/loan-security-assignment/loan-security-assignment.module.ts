import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanSecurityAssignment } from './entities/loan-security-assignment.entity';
import { Pledge } from './entities/pledge.entity';
import { LoanSecurityAssignmentService } from './loan-security-assignment.service';
import { LoanSecurityAssignmentController } from './loan-security-assignment.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanSecurityShortfallModule } from '../loan-security-shortfall/loan-security-shortfall.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoanSecurityAssignment,
      Pledge,
      Loan,
      LoanApplication,
    ]),
    forwardRef(() => LoanSecurityShortfallModule),
  ],
  controllers: [LoanSecurityAssignmentController],
  providers: [LoanSecurityAssignmentService],
  exports: [LoanSecurityAssignmentService],
})
export class LoanSecurityAssignmentModule {}

