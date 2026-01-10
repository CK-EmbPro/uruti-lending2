import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingAssistantService } from './services/onboarding-assistant.service';
import { OnboardingAssistantController } from './onboarding-assistant.controller';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { LoanApplicationDocument } from '../loan-application-document/entities/loan-application-document.entity';
import { Loan } from '../loan/entities/loan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoanApplication, LoanApplicationDocument, Loan]),
  ],
  controllers: [OnboardingAssistantController],
  providers: [OnboardingAssistantService],
  exports: [OnboardingAssistantService],
})
export class OnboardingAssistantModule {}

