import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanApplicationDocument } from '../../loan-application-document/entities/loan-application-document.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { GetOnboardingGuideDto, OnboardingGuideResult, OnboardingStep } from '../dto/onboarding-assistant.dto';
import { ApplicationStatus } from '../../loan-application/entities/loan-application.entity';

@Injectable()
export class OnboardingAssistantService {
  private readonly logger = new Logger(OnboardingAssistantService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanApplicationDocument)
    private readonly documentRepository: Repository<LoanApplicationDocument>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  /**
   * Get personalized onboarding guide
   */
  async getOnboardingGuide(
    dto: GetOnboardingGuideDto,
    companyId: string,
  ): Promise<OnboardingGuideResult> {
    this.logger.log(`Generating onboarding guide for applicant ${dto.applicantId}`);

    // Check existing applications
    const existingApplications = await this.applicationRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    // Check existing loans
    const existingLoans = await this.loanRepository.find({
      where: {
        applicantId: dto.applicantId,
        applicantType: dto.applicantType as any,
        companyId,
      },
      take: 1,
    });

    // Determine current step
    let currentStep = dto.currentStep || OnboardingStep.PROFILE;
    let completionPercentage = 0;

    // If user has loans, they're already onboarded
    if (existingLoans.length > 0) {
      currentStep = OnboardingStep.COMPLETE;
      completionPercentage = 100;
    } else if (existingApplications.length > 0) {
      const latestApp = existingApplications[0];
      
      // Check application status to determine step
      if (latestApp.status === ApplicationStatus.APPROVED) {
        currentStep = OnboardingStep.VERIFICATION;
        completionPercentage = 90;
      } else if (latestApp.status === ApplicationStatus.UNDER_REVIEW) {
        currentStep = OnboardingStep.VERIFICATION;
        completionPercentage = 80;
      } else if (latestApp.status === ApplicationStatus.SUBMITTED) {
        currentStep = OnboardingStep.VERIFICATION;
        completionPercentage = 70;
      } else {
        currentStep = OnboardingStep.APPLICATION;
        completionPercentage = 60;
      }

      // Check documents
      const documents = await this.documentRepository.find({
        where: { loanApplicationId: latestApp.id },
      });

      if (documents.length === 0) {
        currentStep = OnboardingStep.DOCUMENTS;
        completionPercentage = 40;
      } else if (documents.some((doc) => doc.status === 'Pending')) {
        currentStep = OnboardingStep.DOCUMENTS;
        completionPercentage = 50;
      }
    }

    // Build steps information
    const steps = this.buildSteps(currentStep, existingApplications.length > 0);

    // Calculate completion percentage if not set
    if (completionPercentage === 0) {
      completionPercentage = this.calculateCompletionPercentage(steps);
    }

    // Determine next step
    const nextStep = this.getNextStep(currentStep, steps);

    // Get recommended actions
    const recommendedActions = this.getRecommendedActions(currentStep, steps);

    // Get missing requirements
    const missingRequirements = this.getMissingRequirements(currentStep, steps, existingApplications);

    // Calculate estimated time to complete
    const estimatedTimeToComplete = this.calculateEstimatedTime(steps, currentStep);

    return {
      currentStep,
      completionPercentage,
      nextStep,
      steps,
      recommendedActions,
      missingRequirements,
      estimatedTimeToComplete,
    };
  }

  /**
   * Build steps information
   */
  private buildSteps(currentStep: OnboardingStep, hasApplication: boolean): Array<{
    step: OnboardingStep;
    title: string;
    description: string;
    isCompleted: boolean;
    isCurrent: boolean;
    isRequired: boolean;
    estimatedTime: number;
    fields: string[];
  }> {
    const allSteps: OnboardingStep[] = [
      OnboardingStep.PROFILE,
      OnboardingStep.INCOME,
      OnboardingStep.DOCUMENTS,
      OnboardingStep.PRODUCT_SELECTION,
      OnboardingStep.APPLICATION,
      OnboardingStep.VERIFICATION,
      OnboardingStep.COMPLETE,
    ];

    const stepInfo: Record<OnboardingStep, {
      title: string;
      description: string;
      estimatedTime: number;
      fields: string[];
    }> = {
      [OnboardingStep.PROFILE]: {
        title: 'Complete Your Profile',
        description: 'Provide basic personal information',
        estimatedTime: 2,
        fields: ['Name', 'Email', 'Phone', 'Date of Birth', 'Address'],
      },
      [OnboardingStep.INCOME]: {
        title: 'Verify Your Income',
        description: 'Provide income and employment details',
        estimatedTime: 3,
        fields: ['Monthly Income', 'Employment Type', 'Employer Name', 'Employment Duration'],
      },
      [OnboardingStep.DOCUMENTS]: {
        title: 'Upload Required Documents',
        description: 'Upload ID, income proof, and address documents',
        estimatedTime: 5,
        fields: ['ID Card', 'Income Proof', 'Address Proof', 'Bank Statement'],
      },
      [OnboardingStep.PRODUCT_SELECTION]: {
        title: 'Choose Loan Product',
        description: 'Select the best loan product for your needs',
        estimatedTime: 3,
        fields: ['Loan Product', 'Loan Amount', 'Loan Tenure'],
      },
      [OnboardingStep.APPLICATION]: {
        title: 'Submit Application',
        description: 'Review and submit your loan application',
        estimatedTime: 2,
        fields: ['Application Review', 'Terms Acceptance'],
      },
      [OnboardingStep.VERIFICATION]: {
        title: 'Verification & Approval',
        description: 'Wait for document verification and approval',
        estimatedTime: 0,
        fields: ['Document Verification', 'Credit Check', 'Approval'],
      },
      [OnboardingStep.COMPLETE]: {
        title: 'Onboarding Complete',
        description: 'You have successfully completed onboarding',
        estimatedTime: 0,
        fields: [],
      },
    };

    return allSteps.map((step) => {
      const info = stepInfo[step];
      const stepIndex = allSteps.indexOf(step);
      const currentIndex = allSteps.indexOf(currentStep);

      return {
        step,
        title: info.title,
        description: info.description,
        isCompleted: stepIndex < currentIndex || currentStep === OnboardingStep.COMPLETE,
        isCurrent: step === currentStep,
        isRequired: step !== OnboardingStep.COMPLETE,
        estimatedTime: info.estimatedTime,
        fields: info.fields,
      };
    });
  }

  /**
   * Calculate completion percentage
   */
  private calculateCompletionPercentage(steps: any[]): number {
    const completedSteps = steps.filter((s) => s.isCompleted && s.step !== OnboardingStep.COMPLETE).length;
    const totalSteps = steps.filter((s) => s.step !== OnboardingStep.COMPLETE).length;
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  }

  /**
   * Get next step
   */
  private getNextStep(currentStep: OnboardingStep, steps: any[]): OnboardingStep {
    if (currentStep === OnboardingStep.COMPLETE) {
      return OnboardingStep.COMPLETE;
    }

    const currentIndex = steps.findIndex((s) => s.step === currentStep);
    if (currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].step;
    }

    return OnboardingStep.COMPLETE;
  }

  /**
   * Get recommended actions
   */
  private getRecommendedActions(currentStep: OnboardingStep, steps: any[]): string[] {
    const actions: string[] = [];
    const currentStepInfo = steps.find((s) => s.step === currentStep);

    if (!currentStepInfo) {
      return actions;
    }

    switch (currentStep) {
      case OnboardingStep.PROFILE:
        actions.push('Complete your personal information');
        actions.push('Verify your email and phone number');
        break;
      case OnboardingStep.INCOME:
        actions.push('Provide accurate income information');
        actions.push('Upload recent payslips or income statements');
        break;
      case OnboardingStep.DOCUMENTS:
        actions.push('Upload all required documents');
        actions.push('Ensure documents are clear and readable');
        actions.push('Check document expiry dates');
        break;
      case OnboardingStep.PRODUCT_SELECTION:
        actions.push('Use our loan calculator to compare products');
        actions.push('Check your eligibility for different products');
        actions.push('Review interest rates and terms');
        break;
      case OnboardingStep.APPLICATION:
        actions.push('Review all application details');
        actions.push('Ensure all information is accurate');
        actions.push('Submit your application');
        break;
      case OnboardingStep.VERIFICATION:
        actions.push('Wait for document verification');
        actions.push('Respond to any verification requests');
        actions.push('Check application status regularly');
        break;
    }

    return actions;
  }

  /**
   * Get missing requirements
   */
  private getMissingRequirements(
    currentStep: OnboardingStep,
    steps: any[],
    existingApplications: LoanApplication[],
  ): string[] {
    const requirements: string[] = [];

    if (currentStep === OnboardingStep.DOCUMENTS && existingApplications.length > 0) {
      requirements.push('ID Card (PAN/Aadhaar)');
      requirements.push('Income Proof (Payslip/Bank Statement)');
      requirements.push('Address Proof');
    }

    if (currentStep === OnboardingStep.PRODUCT_SELECTION) {
      requirements.push('Loan product selection');
      requirements.push('Loan amount decision');
    }

    if (currentStep === OnboardingStep.APPLICATION) {
      requirements.push('Application submission');
    }

    return requirements;
  }

  /**
   * Calculate estimated time to complete
   */
  private calculateEstimatedTime(steps: any[], currentStep: OnboardingStep): number {
    const currentIndex = steps.findIndex((s) => s.step === currentStep);
    let totalTime = 0;

    for (let i = currentIndex; i < steps.length; i++) {
      if (steps[i].step !== OnboardingStep.COMPLETE && steps[i].step !== OnboardingStep.VERIFICATION) {
        totalTime += steps[i].estimatedTime;
      }
    }

    return totalTime;
  }
}

