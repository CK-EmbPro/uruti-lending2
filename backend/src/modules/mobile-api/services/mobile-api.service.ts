import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceRegistration, MobilePlatform } from '../entities/device-registration.entity';
import {
  RegisterDeviceDto,
  SendPushNotificationDto,
  MobileDashboard,
  MobileLoanDetails,
  MobileApplicationStatus,
  PushNotificationType,
} from '../dto/mobile-api.dto';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanApplication, ApplicationStatus } from '../../loan-application/entities/loan-application.entity';
import { LoanRepayment } from '../../loan-repayment/entities/loan-repayment.entity';
import { LoanStatus } from '../../../common/enums/loan-status.enum';

@Injectable()
export class MobileApiService {
  private readonly logger = new Logger(MobileApiService.name);

  constructor(
    @InjectRepository(DeviceRegistration)
    private readonly deviceRepository: Repository<DeviceRegistration>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
  ) {}

  /**
   * Register device for push notifications
   */
  async registerDevice(
    dto: RegisterDeviceDto,
    userId: string,
    companyId: string,
  ): Promise<void> {
    // Check if device already registered
    let device = await this.deviceRepository.findOne({
      where: { deviceToken: dto.deviceToken, companyId },
    });

    if (device) {
      // Update existing registration
      device.userId = userId;
      device.platform = dto.platform;
      device.deviceId = dto.deviceId;
      device.appVersion = dto.appVersion;
      device.isActive = true;
      device.lastUsedAt = new Date();
      await this.deviceRepository.save(device);
    } else {
      // Create new registration
      device = this.deviceRepository.create({
        companyId,
        userId,
        deviceToken: dto.deviceToken,
        platform: dto.platform,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
        isActive: true,
        lastUsedAt: new Date(),
      });
      await this.deviceRepository.save(device);
    }

    this.logger.log(`Device registered: ${dto.deviceToken} for user ${userId}`);
  }

  /**
   * Unregister device
   */
  async unregisterDevice(deviceToken: string, companyId: string): Promise<void> {
    const device = await this.deviceRepository.findOne({
      where: { deviceToken, companyId },
    });

    if (device) {
      device.isActive = false;
      await this.deviceRepository.save(device);
      this.logger.log(`Device unregistered: ${deviceToken}`);
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(
    dto: SendPushNotificationDto,
    companyId: string,
  ): Promise<void> {
    const devices = await this.deviceRepository.find({
      where: { userId: dto.userId, companyId, isActive: true },
    });

    if (devices.length === 0) {
      this.logger.warn(`No active devices found for user ${dto.userId}`);
      return;
    }

    // In production, would use FCM (Firebase Cloud Messaging) or APNS (Apple Push Notification Service)
    for (const device of devices) {
      this.logger.log(
        `Sending push notification to device ${device.deviceToken}: ${dto.title}`,
      );

      // In production, would actually send push notification
      // await this.sendToFCM(device.deviceToken, dto);
      // or
      // await this.sendToAPNS(device.deviceToken, dto);
    }
  }

  /**
   * Get mobile dashboard
   */
  async getMobileDashboard(
    userId: string,
    companyId: string,
  ): Promise<MobileDashboard> {
    // Get active loans
    const activeLoans = await this.loanRepository.find({
      where: { applicantId: userId, companyId, status: LoanStatus.ACTIVE },
    });

    const totalOutstanding = activeLoans.reduce(
        (sum, loan) => sum + (Number(loan.loanAmount) - Number(loan.totalAmountPaid || 0)),
      0,
    );

    // Get next payment
    const nextRepayment = await this.repaymentRepository.findOne({
      where: { loan: { applicantId: userId, companyId } } as any,
      order: { postingDate: 'ASC' },
    });

    // Get pending applications
    const pendingApplications = await this.applicationRepository.count({
      where: {
        applicantId: userId,
        companyId,
        status: ApplicationStatus.UNDER_REVIEW,
      },
    });

    // Get upcoming payments
    const upcomingPayments = await this.repaymentRepository.find({
      where: { loan: { applicantId: userId, companyId } } as any,
      order: { postingDate: 'ASC' },
      take: 5,
    });

    // Get recent activities (simplified)
    const recentActivities = [
      {
        id: '1',
        type: 'LOAN_APPROVED',
        title: 'Loan Approved',
        description: 'Your loan application has been approved',
        timestamp: new Date().toISOString(),
        actionUrl: '/loans/1',
      },
    ];

    return {
      quickStats: {
        activeLoans: activeLoans.length,
        totalOutstanding,
        nextPaymentDue: nextRepayment ? Number(nextRepayment.amountPaid) : 0,
        nextPaymentDate: nextRepayment?.dueDate?.toISOString() || nextRepayment?.postingDate?.toISOString(),
        pendingApplications,
      },
      recentActivities,
      upcomingPayments: upcomingPayments.map((p) => ({
        loanId: (p.loan as any)?.id || '',
        loanNumber: (p.loan as any)?.loanNumber || '',
        amount: Number(p.amountPaid),
        dueDate: (p.dueDate || p.postingDate).toISOString(),
        daysUntilDue: Math.ceil(
          ((p.dueDate || p.postingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        ),
      })),
      unreadNotifications: 5, // Would calculate from actual notifications
    };
  }

  /**
   * Get mobile loan details
   */
  async getMobileLoanDetails(
    loanId: string,
    userId: string,
    companyId: string,
  ): Promise<MobileLoanDetails> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId, applicantId: userId, companyId },
    });

    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    // Get next payment
    const nextRepayment = await this.repaymentRepository.findOne({
      where: { loan: { id: loanId } } as any,
      order: { postingDate: 'ASC' },
    });

    // Get payment history
    const paymentHistory = await this.repaymentRepository.find({
      where: { loan: { id: loanId } } as any,
      order: { postingDate: 'DESC' },
      take: 10,
    });

    return {
      loan: {
        id: loan.id,
        loanNumber: loan.loanNumber,
        amount: Number(loan.disbursedAmount || loan.loanAmount || 0),
        outstandingBalance: Number(loan.outstandingAmount || 0),
        interestRate: Number(loan.rateOfInterest || 0),
        status: loan.status,
        disbursedDate: loan.postingDate?.toISOString(),
        maturityDate: loan.maturityDate?.toISOString(),
      },
      nextPayment: {
        amount: nextRepayment ? Number(nextRepayment.amountPaid) : 0,
        dueDate: (nextRepayment?.dueDate || nextRepayment?.postingDate)?.toISOString() || '',
        daysUntilDue: nextRepayment
          ? Math.ceil(
              ((nextRepayment.dueDate || nextRepayment.postingDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0,
      },
      paymentHistory: paymentHistory.map((p) => ({
        date: (p.dueDate || p.postingDate).toISOString(),
        amount: Number(p.amountPaid),
        status: p.status || 'PENDING',
      })),
      documents: [], // Would fetch from document service
    };
  }

  /**
   * Get mobile application status
   */
  async getMobileApplicationStatus(
    applicationId: string,
    userId: string,
    companyId: string,
  ): Promise<MobileApplicationStatus> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId, applicantId: userId, companyId },
    });

    if (!application) {
      throw new Error(`Application ${applicationId} not found`);
    }

    // Build timeline
    const timeline = [
      {
        stage: 'SUBMITTED',
        date: application.createdAt.toISOString(),
        description: 'Application submitted',
      },
    ];

    if (application.status === ApplicationStatus.APPROVED) {
      timeline.push({
        stage: 'APPROVED',
        date: application.updatedAt.toISOString(),
        description: 'Application approved',
      });
    }

    // Determine next steps
    const nextSteps: string[] = [];
    if (application.status === ApplicationStatus.UNDER_REVIEW) {
      nextSteps.push('Wait for review', 'Upload any additional documents if requested');
    } else if (application.status === ApplicationStatus.APPROVED) {
      nextSteps.push('Review loan terms', 'Accept loan offer');
    }

    return {
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        appliedAmount: Number(application.requestedAmount || 0),
        approvedAmount: application.approvedAmount
          ? Number(application.approvedAmount)
          : undefined,
        submittedDate: application.createdAt.toISOString(),
      },
      currentStage: application.status,
      timeline,
      requiredDocuments: [], // Would fetch from document service
      nextSteps,
    };
  }
}

