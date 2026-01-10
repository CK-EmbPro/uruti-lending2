import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ZeroBranchOnboardingService } from './services/zero-branch-onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingProgress } from './entities/onboarding-progress.entity';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { ESignatureModule } from '../e-signature/e-signature.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnboardingProgress, LoanApplication]),
    ESignatureModule,
  ],
  controllers: [OnboardingController],
  providers: [ZeroBranchOnboardingService],
  exports: [ZeroBranchOnboardingService],
})
export class OnboardingModule {}

