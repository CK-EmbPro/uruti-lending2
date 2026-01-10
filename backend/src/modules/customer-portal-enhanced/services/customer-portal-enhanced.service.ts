import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomerPaymentMethod } from '../entities/payment-method.entity';
import { CustomerAutoPay } from '../entities/auto-pay.entity';
import { CustomerDocument } from '../entities/customer-document.entity';
import { CustomerCommunicationPreference } from '../entities/communication-preference.entity';
import { PaymentMethodStatus, AutoPayFrequency, CommunicationPreference } from '../dto/customer-portal-enhanced.dto';
import { CustomerFinancialGoal } from '../entities/financial-goal.entity';
import {
  AddPaymentMethodDto,
  SetupAutoPayDto,
  SubmitLoanApplicationDto,
  UploadDocumentDto,
  UpdateCommunicationPreferencesDto,
  FinancialGoalDto,
  PaymentMethodType,
} from '../dto/customer-portal-enhanced.dto';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanRepaymentSchedule } from '../../loan/entities/loan-repayment-schedule.entity';

@Injectable()
export class CustomerPortalEnhancedService {
  private readonly logger = new Logger(CustomerPortalEnhancedService.name);

  constructor(
    @InjectRepository(CustomerPaymentMethod)
    private paymentMethodRepository: Repository<CustomerPaymentMethod>,
    @InjectRepository(CustomerAutoPay)
    private autoPayRepository: Repository<CustomerAutoPay>,
    @InjectRepository(CustomerDocument)
    private documentRepository: Repository<CustomerDocument>,
    @InjectRepository(CustomerCommunicationPreference)
    private communicationPreferenceRepository: Repository<CustomerCommunicationPreference>,
    @InjectRepository(CustomerFinancialGoal)
    private financialGoalRepository: Repository<CustomerFinancialGoal>,
    @InjectRepository(LoanApplication)
    private loanApplicationRepository: Repository<LoanApplication>,
    @InjectRepository(Loan)
    private loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepaymentSchedule)
    private scheduleRepository: Repository<LoanRepaymentSchedule>,
  ) {}

  // Payment Methods
  async addPaymentMethod(customerId: string, addDto: AddPaymentMethodDto): Promise<CustomerPaymentMethod> {
    const paymentMethod = this.paymentMethodRepository.create({
      customerId,
      ...addDto,
      status: PaymentMethodStatus.PENDING_VERIFICATION,
    });

    // If this is set as default, unset other defaults
    if (addDto.isDefault) {
      await this.paymentMethodRepository.update(
        { customerId, isDefault: true },
        { isDefault: false },
      );
    }

    return this.paymentMethodRepository.save(paymentMethod);
  }

  async getPaymentMethods(customerId: string): Promise<CustomerPaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { customerId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string): Promise<CustomerPaymentMethod> {
    // Unset all defaults
    await this.paymentMethodRepository.update(
      { customerId, isDefault: true },
      { isDefault: false },
    );

    // Set new default
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, customerId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${paymentMethodId} not found`);
    }

    paymentMethod.isDefault = true;
    return this.paymentMethodRepository.save(paymentMethod);
  }

  async removePaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: paymentMethodId, customerId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${paymentMethodId} not found`);
    }

    // Check if it's used in any active auto-pay
    const activeAutoPay = await this.autoPayRepository.findOne({
      where: { paymentMethodId, isActive: true },
    });

    if (activeAutoPay) {
      throw new BadRequestException('Cannot remove payment method that is used in active auto-pay');
    }

    await this.paymentMethodRepository.remove(paymentMethod);
  }

  // Auto-Pay
  async setupAutoPay(customerId: string, setupDto: SetupAutoPayDto): Promise<CustomerAutoPay> {
    // Verify loan belongs to customer
    const loan = await this.loanRepository.findOne({
      where: { id: setupDto.loanId },
    });

    if (!loan) {
      throw new NotFoundException(`Loan with ID ${setupDto.loanId} not found`);
    }

    // Verify payment method belongs to customer
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: setupDto.paymentMethodId, customerId },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${setupDto.paymentMethodId} not found`);
    }

    // Check if auto-pay already exists for this loan
    const existing = await this.autoPayRepository.findOne({
      where: { loanId: setupDto.loanId, isActive: true },
    });

    if (existing) {
      throw new BadRequestException('Active auto-pay already exists for this loan');
    }

    // Calculate next payment date
    const nextPaymentDate = this.calculateNextPaymentDate(setupDto.frequency, setupDto.startDate);

    const autoPay = this.autoPayRepository.create({
      customerId,
      ...setupDto,
      nextPaymentDate,
      startDate: setupDto.startDate ? new Date(setupDto.startDate) : new Date(),
    });

    return this.autoPayRepository.save(autoPay);
  }

  private calculateNextPaymentDate(frequency: AutoPayFrequency, startDate?: string): Date {
    const date = startDate ? new Date(startDate) : new Date();
    
    switch (frequency) {
      case AutoPayFrequency.WEEKLY:
        date.setDate(date.getDate() + 7);
        break;
      case AutoPayFrequency.BIWEEKLY:
        date.setDate(date.getDate() + 14);
        break;
      case AutoPayFrequency.MONTHLY:
        date.setMonth(date.getMonth() + 1);
        break;
    }

    return date;
  }

  async getAutoPayConfigurations(customerId: string): Promise<CustomerAutoPay[]> {
    return this.autoPayRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelAutoPay(customerId: string, autoPayId: string): Promise<void> {
    const autoPay = await this.autoPayRepository.findOne({
      where: { id: autoPayId, customerId },
    });

    if (!autoPay) {
      throw new NotFoundException(`Auto-pay with ID ${autoPayId} not found`);
    }

    autoPay.isActive = false;
    await this.autoPayRepository.save(autoPay);
  }

  // Loan Application
  async submitLoanApplication(customerId: string, submitDto: SubmitLoanApplicationDto, companyId: string): Promise<LoanApplication> {
    const application = this.loanApplicationRepository.create({
      applicantId: customerId as string,
      applicantType: 'Customer' as string,
      companyId: companyId as string,
      loanProductId: submitDto.loanProductId as string,
      requestedAmount: submitDto.requestedAmount,
      remarks: (submitDto.purpose || submitDto.additionalInfo || '') as string,
      status: ApplicationStatus.DRAFT,
      applicationDate: new Date(),
    } as Partial<LoanApplication>);

    return this.loanApplicationRepository.save(application);
  }

  async getLoanApplications(customerId: string): Promise<LoanApplication[]> {
    return this.loanApplicationRepository.find({
      where: { applicantId: customerId, applicantType: 'Customer' },
      order: { createdAt: 'DESC' },
    });
  }

  // Documents
  async uploadDocument(customerId: string, uploadDto: UploadDocumentDto): Promise<CustomerDocument> {
    const document = this.documentRepository.create({
      customerId,
      ...uploadDto,
      uploadedDate: new Date(),
      fileSize: 0, // TODO: Calculate from file
      mimeType: 'application/pdf', // TODO: Detect from file
    });

    return this.documentRepository.save(document);
  }

  async getDocuments(customerId: string, loanApplicationId?: string): Promise<CustomerDocument[]> {
    const where: any = { customerId };
    if (loanApplicationId) where.loanApplicationId = loanApplicationId;

    return this.documentRepository.find({
      where,
      order: { uploadedDate: 'DESC' },
    });
  }

  async deleteDocument(customerId: string, documentId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, customerId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    await this.documentRepository.remove(document);
  }

  // Communication Preferences
  async getCommunicationPreferences(customerId: string): Promise<CustomerCommunicationPreference> {
    let preferences = await this.communicationPreferenceRepository.findOne({
      where: { customerId },
    });

    if (!preferences) {
      preferences = this.communicationPreferenceRepository.create({
        customerId,
        paymentReminders: CommunicationPreference.EMAIL,
        statementNotifications: CommunicationPreference.EMAIL,
        accountUpdates: CommunicationPreference.EMAIL,
        marketing: CommunicationPreference.NONE,
      });
      preferences = await this.communicationPreferenceRepository.save(preferences);
    }

    return preferences;
  }

  async updateCommunicationPreferences(
    customerId: string,
    updateDto: UpdateCommunicationPreferencesDto,
  ): Promise<CustomerCommunicationPreference> {
    let preferences = await this.communicationPreferenceRepository.findOne({
      where: { customerId },
    });

    if (!preferences) {
      preferences = this.communicationPreferenceRepository.create({ customerId });
    }

    Object.assign(preferences, updateDto);
    return this.communicationPreferenceRepository.save(preferences);
  }

  // Financial Goals
  async createFinancialGoal(customerId: string, goalDto: FinancialGoalDto): Promise<CustomerFinancialGoal> {
    const goal = this.financialGoalRepository.create({
      customerId,
      ...goalDto,
      targetDate: new Date(goalDto.targetDate),
      currentProgress: goalDto.currentProgress || 0,
    });

    return this.financialGoalRepository.save(goal);
  }

  async getFinancialGoals(customerId: string): Promise<CustomerFinancialGoal[]> {
    return this.financialGoalRepository.find({
      where: { customerId, isActive: true },
      order: { targetDate: 'ASC' },
    });
  }

  async updateFinancialGoalProgress(
    customerId: string,
    goalId: string,
    progress: number,
  ): Promise<CustomerFinancialGoal> {
    const goal = await this.financialGoalRepository.findOne({
      where: { id: goalId, customerId },
    });

    if (!goal) {
      throw new NotFoundException(`Financial goal with ID ${goalId} not found`);
    }

    goal.currentProgress = progress;
    if (goal.currentProgress >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      goal.completedDate = new Date();
    }

    return this.financialGoalRepository.save(goal);
  }

  // Process Auto-Pay (scheduled job)
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async processAutoPayments() {
    this.logger.log('Processing auto-payments...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueAutoPays = await this.autoPayRepository.find({
      where: {
        isActive: true,
        nextPaymentDate: today,
      },
    });

    for (const autoPay of dueAutoPays) {
      try {
        await this.executeAutoPayment(autoPay);
      } catch (error) {
        this.logger.error(`Error processing auto-pay ${autoPay.id}: ${error.message}`);
      }
    }

    this.logger.log(`Processed ${dueAutoPays.length} auto-payments`);
  }

  private async executeAutoPayment(autoPay: CustomerAutoPay): Promise<void> {
    // Get loan details
    const loan = await this.loanRepository.findOne({
      where: { id: autoPay.loanId },
    });

    if (!loan) {
      this.logger.error(`Loan ${autoPay.loanId} not found for auto-pay ${autoPay.id}`);
      return;
    }

    // Calculate payment amount
    let paymentAmount = autoPay.amount;
    if (!paymentAmount) {
      // Get minimum payment from schedule
      const nextSchedule = await this.scheduleRepository.findOne({
        where: { loanId: autoPay.loanId, status: 'Pending' as any },
        order: { paymentDate: 'ASC' },
      });
      paymentAmount = nextSchedule ? Number(nextSchedule.principalAmount) + Number(nextSchedule.interestAmount) : 0;
    }

    // TODO: Integrate with payment processor to process payment
    // For now, just log and update next payment date
    this.logger.log(`Processing auto-payment: ${paymentAmount} for loan ${autoPay.loanId}`);

    // Update auto-pay
    autoPay.lastPaymentDate = new Date();
    autoPay.paymentCount += 1;
    autoPay.nextPaymentDate = this.calculateNextPaymentDate(autoPay.frequency);
    await this.autoPayRepository.save(autoPay);
  }
}

