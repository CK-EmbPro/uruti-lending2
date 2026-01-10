import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { LoanApplication, ApplicationStatus } from './entities/loan-application.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ApplicationRecoveryService {
  private readonly logger = new Logger(ApplicationRecoveryService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly loanApplicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Find abandoned applications (Draft status, older than 24 hours, not updated recently)
   */
  async findAbandonedApplications(): Promise<LoanApplication[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const abandoned = await this.loanApplicationRepository.find({
      where: {
        status: ApplicationStatus.DRAFT,
        createdAt: LessThan(twentyFourHoursAgo),
      },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`Found ${abandoned.length} abandoned applications`);
    return abandoned;
  }

  /**
   * Get abandoned applications for a specific applicant
   */
  async getAbandonedByApplicant(
    applicantId: string,
    applicantType: string,
  ): Promise<LoanApplication[]> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return await this.loanApplicationRepository.find({
      where: {
        applicantId,
        applicantType,
        status: ApplicationStatus.DRAFT,
        createdAt: LessThan(twentyFourHoursAgo),
      },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if application is abandoned
   */
  async isAbandoned(applicationId: string): Promise<boolean> {
    const application = await this.loanApplicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application || application.status !== ApplicationStatus.DRAFT) {
      return false;
    }

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return application.createdAt < twentyFourHoursAgo;
  }

  /**
   * Calculate days since application was created
   */
  calculateDaysSinceCreated(application: LoanApplication): number {
    const now = new Date();
    const created = new Date(application.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get recovery priority based on age
   */
  getRecoveryPriority(application: LoanApplication): 'high' | 'medium' | 'low' {
    const daysSinceCreated = this.calculateDaysSinceCreated(application);

    if (daysSinceCreated >= 7) return 'high';
    if (daysSinceCreated >= 3) return 'medium';
    return 'low';
  }

  /**
   * Scheduled job: Daily check for abandoned applications
   * Runs every day at 9 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleAbandonedApplicationsCheck() {
    this.logger.log('Running abandoned applications check...');

    try {
      const abandoned = await this.findAbandonedApplications();

      for (const application of abandoned) {
        const daysSinceCreated = this.calculateDaysSinceCreated(application);
        const priority = this.getRecoveryPriority(application);

        this.logger.log(
          `Abandoned application ${application.applicationNumber}: ` +
          `${daysSinceCreated} days old, priority: ${priority}`,
        );

        // In a real implementation, this would trigger email/SMS notifications
        // For now, we just log it
        // await this.sendRecoveryNotification(application, priority);
      }

      this.logger.log(`Abandoned applications check completed. Found ${abandoned.length} applications.`);
    } catch (error) {
      this.logger.error(`Error checking abandoned applications: ${error.message}`, error.stack);
    }
  }

  /**
   * Send recovery notification (placeholder - would integrate with notification service)
   */
  async sendRecoveryNotification(
    application: LoanApplication,
    priority: 'high' | 'medium' | 'low',
  ): Promise<void> {
    // This would integrate with a notification service
    // For now, it's a placeholder
    this.logger.log(
      `Would send ${priority} priority recovery notification for application ${application.applicationNumber}`,
    );
  }

  /**
   * Mark application as recovered (when user returns to complete it)
   */
  async markAsRecovered(applicationId: string): Promise<void> {
    const application = await this.loanApplicationRepository.findOne({
      where: { id: applicationId },
    });

    if (application) {
      // Update the application to indicate recovery
      // This could involve updating a field or just logging
      this.logger.log(`Application ${application.applicationNumber} marked as recovered`);
    }
  }
}

