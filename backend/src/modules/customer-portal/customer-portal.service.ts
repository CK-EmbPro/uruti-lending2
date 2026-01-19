import { Injectable, UnauthorizedException, ConflictException, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { format } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomerPortalUser } from './entities/customer-portal-user.entity';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerRegisterDto } from './dto/customer-register.dto';
import { Loan } from '../loan/entities/loan.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';
import { LoanRepaymentSchedule } from '../loan/entities/loan-repayment-schedule.entity';
import { LoanStatement } from '../account-management/entities/loan-statement.entity';
import { AccountInquiryService } from '../account-management/services/account-inquiry.service';
import { CustomerLoanLink } from './entities/customer-loan-link.entity';
import { LinkLoanDto } from './dto/link-loan.dto';
import { VerifyLoanLinkDto, VerificationAction } from './dto/verify-loan-link.dto';
import { LoanApplication } from '../loan-application/entities/loan-application.entity';
import { NotificationService } from '../notification/services/notification.service';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { NotificationChannel } from '../../common/enums/notification-channel.enum';
import { RiskTierService } from '../credit-scoring-engine/services/risk-tier.service';
import { ScoringHistoryService } from '../credit-scoring-engine/services/scoring-history.service';
import { RiskTier } from '../credit-scoring-engine/entities/risk-tier-config.entity';
import { NotificationLog } from '../notification/entities/notification-log.entity';
import { NotificationStatus } from '../../common/enums/notification-status.enum';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { ScheduledPayment, ScheduledPaymentStatus, PaymentAmountType } from './entities/scheduled-payment.entity';
import { SchedulePaymentDto, CancelScheduledPaymentDto } from './dto/schedule-payment.dto';
import { LoanRepaymentService } from '../loan-repayment/loan-repayment.service';
import { RepaymentType } from '../../common/enums/repayment-type.enum';
import { Company } from '../company/entities/company.entity';
import { LoanProduct } from '../loan-product/entities/loan-product.entity';
import { LoanApplicationService } from '../loan-application/loan-application.service';
import { CreateLoanApplicationDto } from '../loan-application/dto/create-loan-application.dto';


@Injectable()
export class CustomerPortalService {
  private readonly logger = new Logger(CustomerPortalService.name);

  constructor(
    @InjectRepository(CustomerPortalUser)
    private readonly customerUserRepository: Repository<CustomerPortalUser>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(LoanRepayment)
    private readonly repaymentRepository: Repository<LoanRepayment>,
    @InjectRepository(LoanRepaymentSchedule)
    private readonly scheduleRepository: Repository<LoanRepaymentSchedule>,
    @InjectRepository(LoanStatement)
    private readonly statementRepository: Repository<LoanStatement>,
    @InjectRepository(CustomerLoanLink)
    private readonly loanLinkRepository: Repository<CustomerLoanLink>,
    @InjectRepository(LoanApplication)
    private readonly loanApplicationRepository: Repository<LoanApplication>,
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepository: Repository<NotificationLog>,
    @InjectRepository(ScheduledPayment)
    private readonly scheduledPaymentRepository: Repository<ScheduledPayment>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(LoanProduct)
    private readonly loanProductRepository: Repository<LoanProduct>,
    private readonly jwtService: JwtService,
    private readonly accountInquiryService: AccountInquiryService,
    private readonly notificationService: NotificationService,
    private readonly loanRepaymentService: LoanRepaymentService,
    private readonly riskTierService: RiskTierService,
    private readonly scoringHistoryService: ScoringHistoryService,
    private readonly loanApplicationService: LoanApplicationService,
  ) {}

  async register(registerDto: CustomerRegisterDto): Promise<{ access_token: string; user: Partial<CustomerPortalUser> }> {
    // Check if user already exists
    const existingUser = await this.customerUserRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Customer account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create customer portal user
    const user = this.customerUserRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      phoneNumber: registerDto.phoneNumber,
    });

    const savedUser = await this.customerUserRepository.save(user);

    // Generate JWT token
    const payload = { 
      email: savedUser.email, 
      sub: savedUser.id, 
      type: 'customer',
      name: savedUser.name,
    };
    const access_token = this.jwtService.sign(payload);

    const { password: _, ...userWithoutPassword } = savedUser;

    this.logger.log(`Customer portal user registered: ${savedUser.email}`);

    return {
      access_token,
      user: userWithoutPassword,
    };
  }

  async login(loginDto: CustomerLoginDto): Promise<{ access_token?: string; tempToken?: string; requiresMfa: boolean; user: Partial<CustomerPortalUser> }> {
    try {
      this.logger.debug(`Customer portal login attempt: ${loginDto.email}`);
      
      const user = await this.customerUserRepository.findOne({ 
        where: { email: loginDto.email } 
      });

      if (!user) {
        this.logger.warn(`Customer portal login failed: User not found - ${loginDto.email}`);
        throw new NotFoundException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      
      if (!isPasswordValid) {
        this.logger.warn(`Customer portal login failed: Invalid password - ${loginDto.email}`);
        throw new BadRequestException('Invalid password provided');
      }

      // Optional: Verify loan number if provided
      if (loginDto.loanNumber) {
        const hasLoan = await this.loanRepository.findOne({
          where: { 
            loanNumber: loginDto.loanNumber,
            applicantId: user.email, // Match by email as applicantId
          },
        });

        if (!hasLoan) {
          this.logger.warn(`Customer portal login: Loan number ${loginDto.loanNumber} not found for ${loginDto.email}`);
          // Don't fail login, just log warning
        }
      }

      const { password: _, ...userWithoutPassword } = user;

      // If MFA is enabled, return temporary token instead of access token
      if (user.isMfaEnabled && user.mfaSecret) {
        // Generate temporary token for MFA verification (expires in 5 minutes)
        const tempPayload = {
          email: user.email,
          sub: user.id,
          type: 'customer_mfa_pending',
          name: user.name,
        };
        const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '5m' });

        this.logger.log(`Customer portal login: MFA required for ${user.email}`);

        return {
          tempToken,
          requiresMfa: true,
          user: userWithoutPassword,
        };
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.customerUserRepository.save(user);

      // Generate JWT token
      const payload = { 
        email: user.email, 
        sub: user.id, 
        type: 'customer',
        name: user.name,
      };
      const access_token = this.jwtService.sign(payload);

      this.logger.log(`Customer portal login successful: ${user.email}`);

      return {
        access_token,
        requiresMfa: false,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException || 
        error instanceof NotFoundException || 
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Customer portal login error: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Login failed. Please try again.');
    }
  }

  async getMyLoans(customerEmail: string, customerId?: string): Promise<Loan[]> {
    // Find loans where applicantId matches customer email
    const loansByEmail = await this.loanRepository.find({
      where: [
        { applicantId: customerEmail },
      ],
      relations: ['loanProduct'],
      order: { createdAt: 'DESC' },
    });

    // Find loans linked to customer account
    let linkedLoans: Loan[] = [];
    if (customerId) {
      const links = await this.loanLinkRepository.find({
        where: { customerId, isVerified: true },
        relations: ['loan', 'loan.loanProduct'],
      });
      linkedLoans = links.map(link => link.loan).filter(Boolean);
    }

    // Combine and deduplicate by loan ID
    const allLoans = [...loansByEmail, ...linkedLoans];
    const uniqueLoans = allLoans.filter((loan, index, self) =>
      index === self.findIndex(l => l.id === loan.id)
    );

    return uniqueLoans;
  }

  async getMyLoan(loanId: string, customerEmail: string, customerId?: string): Promise<Loan> {
    // First check if loan matches by email
    let loan = await this.loanRepository.findOne({
      where: { 
        id: loanId,
        applicantId: customerEmail,
      },
      relations: ['loanProduct'],
    });

    // If not found, check if it's linked to customer account
    if (!loan && customerId) {
      const link = await this.loanLinkRepository.findOne({
        where: { 
          loanId,
          customerId,
          isVerified: true,
        },
        relations: ['loan', 'loan.loanProduct'],
      });

      if (link && link.loan) {
        loan = link.loan;
      }
    }

    if (!loan) {
      throw new NotFoundException('Loan not found or you do not have access to this loan');
    }

    return loan;
  }

  async getLoanSummary(loanId: string, customerEmail: string, customerId?: string) {
    // Verify loan belongs to customer
    await this.getMyLoan(loanId, customerEmail, customerId);

    // Get account summary using account inquiry service
    return this.accountInquiryService.getAccountSummary(loanId);
  }

  async getPaymentHistory(loanId: string, customerEmail: string, customerId?: string, limit?: number) {
    // Verify loan belongs to customer
    await this.getMyLoan(loanId, customerEmail, customerId);

    const repayments = await this.repaymentRepository.find({
      where: { loanId },
      order: { postingDate: 'DESC' },
      take: limit || 50,
    });

    return repayments;
  }

  async getUpcomingPayments(loanId: string, customerEmail: string, customerId?: string, limit?: number) {
    // Verify loan belongs to customer
    await this.getMyLoan(loanId, customerEmail, customerId);

    const upcoming = await this.scheduleRepository.find({
      where: { 
        loanId,
        status: 'Pending' as any,
      },
      order: { paymentDate: 'ASC' },
      take: limit || 12,
    });

    return upcoming;
  }

  async getStatements(loanId: string, customerEmail: string, customerId?: string) {
    // Verify loan belongs to customer
    await this.getMyLoan(loanId, customerEmail, customerId);

    const statements = await this.statementRepository.find({
      where: { loanId },
      order: { statementDate: 'DESC' },
    });

    return statements;
  }

  async getAllDocuments(customerEmail: string, customerId?: string) {
    // Get all loans for customer
    const loans = await this.getMyLoans(customerEmail, customerId);
    
    if (loans.length === 0) {
      return [];
    }
    
    const loanIds = loans.map(loan => loan.id);

    // Get all statements for customer's loans
    const statements = await this.statementRepository.find({
      where: { loanId: In(loanIds) },
      relations: ['loan'],
      order: { statementDate: 'DESC' },
    });

    // Format documents for frontend
    const documents = statements.map(statement => {
      let title = `${statement.statementType || 'Document'} Statement`;
      try {
        if (statement.statementDate) {
          title += ` - ${format(new Date(statement.statementDate), 'MMM yyyy')}`;
        }
      } catch (e) {
        this.logger.warn(`Failed to format statement date: ${statement.statementDate}`);
      }

      return {
        id: statement.id,
        type: 'STATEMENT',
        documentType: statement.statementType,
        title,
        loanNumber: statement.loan?.loanNumber,
        loanId: statement.loanId,
        date: statement.statementDate,
        periodStart: statement.periodStartDate,
        periodEnd: statement.periodEndDate,
        fileUrl: statement.fileUrl,
        filePath: statement.filePath,
        status: statement.status,
        createdAt: statement.createdAt,
      };
    });

    return documents;
  }

  /**
   * Get risk tier information for the customer
   */
  async getRiskTier(customerId: string) {
    const latestScore = await this.scoringHistoryService.getLatestScore(customerId);
    
    if (!latestScore) {
      return null;
    }

    const tier = latestScore.riskTier as RiskTier;
    // Note: We're not passing companyId here to use defaults or simpler logic if needed
    // In a multi-tenant system, we might need to find the company associated with the user's loans
    const tierInfo = await this.riskTierService.getTierInfo(tier);

    return {
      tier: tierInfo.tier,
      displayName: tierInfo.displayName,
      description: tierInfo.description,
      badgeColor: tierInfo.badgeColor,
      iconUrl: tierInfo.iconUrl,
      benefits: tierInfo.benefits,
      limitations: tierInfo.limitations,
      scoreRange: tierInfo.scoreRange,
      currentScore: latestScore.finalScore,
      lastCalculatedAt: latestScore.calculatedAt,
    };
  }

  async getCurrentUser(userId: string): Promise<Partial<CustomerPortalUser>> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'phoneNumber', 'isActive', 'emailVerified', 'createdAt', 'updatedAt', 'lastLoginAt'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateDto: { name?: string; phoneNumber?: string }): Promise<Partial<CustomerPortalUser>> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateDto.name) {
      user.name = updateDto.name;
    }

    if (updateDto.phoneNumber !== undefined) {
      user.phoneNumber = updateDto.phoneNumber;
    }

    const updatedUser = await this.customerUserRepository.save(user);
    const { password, ...userWithoutPassword } = updatedUser;
    
    this.logger.log(`Profile updated for user ${userId}`);
    return userWithoutPassword;
  }

  async updateEmail(userId: string, newEmail: string): Promise<Partial<CustomerPortalUser>> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already taken
    const existingUser = await this.customerUserRepository.findOne({
      where: { email: newEmail },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email address is already in use');
    }

    user.email = newEmail;
    user.emailVerified = false; // Require re-verification for new email
    user.emailVerificationToken = null;
    user.emailVerifiedAt = null;

    const updatedUser = await this.customerUserRepository.save(user);
    const { password, ...userWithoutPassword } = updatedUser;
    
    this.logger.log(`Email updated for user ${userId} to ${newEmail}`);
    
    // Send verification email to new address
    try {
      await this.notificationService.sendNotification({
        recipientId: userId,
        notificationType: NotificationType.PROFILE_UPDATED,
        channel: NotificationChannel.EMAIL,
        subject: 'Email Address Changed - Verification Required',
        body: `Your email address has been changed to ${newEmail}. Please verify your new email address.`,
        metadata: {
          recipientEmail: newEmail,
          oldEmail: user.email,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to send email verification: ${error.message}`);
    }

    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await this.customerUserRepository.save(user);
    
    this.logger.log(`Password changed for user ${userId}`);
    
    // Send notification
    try {
      await this.notificationService.sendNotification({
        recipientId: userId,
        notificationType: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        subject: 'Password Changed Successfully',
        body: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
        metadata: {
          recipientEmail: user.email,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to send password change notification: ${error.message}`);
    }
  }

  async getNotifications(userId: string, limit: number = 50, unreadOnly: boolean = false) {
    const where: any = {
      recipientId: userId,
      channel: NotificationChannel.IN_APP,
    };

    if (unreadOnly) {
      where.readAt = null;
    }

    const notifications = await this.notificationLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return notifications;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    return this.notificationLogRepository.count({
      where: {
        recipientId: userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
    });
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationLogRepository.findOne({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationLogRepository.save(notification);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.notificationLogRepository.update(
      {
        recipientId: userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
      {
        readAt: new Date(),
      },
    );
  }

  async setupMfa(userId: string): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isMfaEnabled) {
      throw new ConflictException('MFA is already enabled for this account');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Uruti Lending (${user.email})`,
      issuer: 'Uruti Lending',
      length: 32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Generate backup codes (8 codes, 8 digits each)
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.floor(10000000 + Math.random() * 90000000).toString(),
    );

    // Store secret temporarily (will be saved after verification)
    // In production, you might want to store backup codes separately
    user.mfaSecret = secret.base32!;
    await this.customerUserRepository.save(user);

    this.logger.log(`MFA setup initiated for user ${userId}`);

    return {
      secret: secret.base32!,
      qrCodeUrl,
      backupCodes,
    };
  }

  async verifyMfaSetup(userId: string, token: string): Promise<void> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated. Please start MFA setup first.');
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps (60 seconds) before/after
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid MFA token. Please try again.');
    }

    // Enable MFA
    user.isMfaEnabled = true;
    user.mfaEnabledAt = new Date();
    await this.customerUserRepository.save(user);

    this.logger.log(`MFA enabled for user ${userId}`);

    // Send notification
    try {
      await this.notificationService.sendNotification({
        recipientId: userId,
        notificationType: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        subject: 'Two-Factor Authentication Enabled',
        body: 'Two-factor authentication has been successfully enabled on your account. Your account is now more secure.',
        metadata: {
          recipientEmail: user.email,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to send MFA enabled notification: ${error.message}`);
    }
  }

  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.isMfaEnabled || !user.mfaSecret) {
      return false;
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    return verified;
  }

  async disableMfa(userId: string, token: string): Promise<void> {
    const user = await this.customerUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isMfaEnabled) {
      throw new BadRequestException('MFA is not enabled for this account');
    }

    // Verify token before disabling
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret!,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      throw new UnauthorizedException('Invalid MFA token. Please provide a valid token to disable MFA.');
    }

    // Disable MFA
    user.isMfaEnabled = false;
    user.mfaSecret = null;
    user.mfaEnabledAt = null;
    await this.customerUserRepository.save(user);

    this.logger.log(`MFA disabled for user ${userId}`);

    // Send notification
    try {
      await this.notificationService.sendNotification({
        recipientId: userId,
        notificationType: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.EMAIL,
        subject: 'Two-Factor Authentication Disabled',
        body: 'Two-factor authentication has been disabled on your account. Please re-enable it to keep your account secure.',
        metadata: {
          recipientEmail: user.email,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to send MFA disabled notification: ${error.message}`);
    }
  }

  async getPendingVerifications(): Promise<CustomerLoanLink[]> {
    try {
      const links = await this.loanLinkRepository.find({
        where: { isVerified: false },
        relations: ['customer', 'loan', 'loan.loanProduct'],
        order: { createdAt: 'ASC' }, // Oldest first - prioritize older requests
      });
      
      this.logger.debug(`Found ${links.length} pending verifications`);
      return links;
    } catch (error) {
      this.logger.error(`Error fetching pending verifications: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getLinkById(linkId: string): Promise<CustomerLoanLink> {
    const link = await this.loanLinkRepository.findOne({
      where: { id: linkId },
      relations: ['customer', 'loan', 'loan.loanProduct'],
    });

    if (!link) {
      throw new NotFoundException('Loan link not found');
    }

    return link;
  }

  async verifyLoanLink(
    linkId: string,
    adminId: string,
    verifyDto: VerifyLoanLinkDto,
  ): Promise<CustomerLoanLink> {
    const link = await this.getLinkById(linkId);

    const action = verifyDto.action === VerificationAction.APPROVE ? 'approve' :
                   verifyDto.action === VerificationAction.REJECT ? 'reject' :
                   verifyDto.action === VerificationAction.REQUEST_INFO ? 'request_info' :
                   verifyDto.action;

    if (action === 'approve') {
      link.isVerified = true;
      link.verificationMethod = verifyDto.verificationMethod || 'MANUAL_ADMIN_VERIFICATION';
      link.verifiedAt = new Date();
      link.verifiedBy = adminId;
      link.adminNotes = verifyDto.comments || null;
      link.rejectionReason = null;
      link.rejectedAt = null;
      link.rejectedBy = null;

      this.logger.log(`Loan link ${linkId} approved by admin ${adminId}`);

      // Send notification to customer
      try {
        await this.notificationService.sendNotification({
          recipientId: link.customerId,
          notificationType: NotificationType.PROFILE_UPDATED, // Using existing type, could add new type
          channel: NotificationChannel.EMAIL,
          subject: `Loan ${link.loan?.loanNumber || 'Link'} Verified`,
          body: `Your loan link request for ${link.loan?.loanNumber || 'loan'} has been verified and approved. You can now access your loan information in the customer portal.`,
          metadata: {
            loanId: link.loanId,
            loanNumber: link.loan?.loanNumber,
            linkId: link.id,
            recipientEmail: link.customer?.email,
          },
        });

        // Also send in-app notification
        await this.notificationService.sendNotification({
          recipientId: link.customerId,
          notificationType: NotificationType.PROFILE_UPDATED,
          channel: NotificationChannel.IN_APP,
          subject: `Loan ${link.loan?.loanNumber || 'Link'} Verified`,
          body: `Your loan link has been verified. You can now view your loan details.`,
          metadata: {
            loanId: link.loanId,
            loanNumber: link.loan?.loanNumber,
            linkId: link.id,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to send verification approval notification: ${error.message}`);
      }
    } else if (action === 'reject') {
      link.isVerified = false;
      link.rejectionReason = verifyDto.comments || 'Verification rejected';
      link.rejectedAt = new Date();
      link.rejectedBy = adminId;
      link.adminNotes = verifyDto.comments || null;

      this.logger.log(`Loan link ${linkId} rejected by admin ${adminId}`);

      // Send notification to customer
      try {
        await this.notificationService.sendNotification({
          recipientId: link.customerId,
          notificationType: NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.EMAIL,
          subject: `Loan Link Verification Rejected`,
          body: `Your loan link request for ${link.loan?.loanNumber || 'loan'} has been rejected. Reason: ${link.rejectionReason}. Please contact support if you have questions.`,
          metadata: {
            loanId: link.loanId,
            loanNumber: link.loan?.loanNumber,
            linkId: link.id,
            rejectionReason: link.rejectionReason,
            recipientEmail: link.customer?.email,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to send rejection notification: ${error.message}`);
      }
    } else if (action === 'request_info') {
      link.adminNotes = verifyDto.comments || 'Additional information requested';
      // Keep link as unverified but add notes
      this.logger.log(`Additional info requested for loan link ${linkId} by admin ${adminId}`);

      // Send notification to customer
      try {
        await this.notificationService.sendNotification({
          recipientId: link.customerId,
          notificationType: NotificationType.SYSTEM_ALERT,
          channel: NotificationChannel.EMAIL,
          subject: `Additional Information Required for Loan Link`,
          body: `We need additional information to verify your loan link request for ${link.loan?.loanNumber || 'loan'}. ${verifyDto.comments || 'Please contact support with your loan details.'}`,
          metadata: {
            loanId: link.loanId,
            loanNumber: link.loan?.loanNumber,
            linkId: link.id,
            adminNotes: link.adminNotes,
            recipientEmail: link.customer?.email,
          },
        });
      } catch (error) {
        this.logger.warn(`Failed to send info request notification: ${error.message}`);
      }
    }

    return this.loanLinkRepository.save(link);
  }

  async linkLoan(customerId: string, customerEmail: string, linkDto: LinkLoanDto): Promise<{ loan: Loan; link: CustomerLoanLink }> {
    // Find the loan by loan number
    const loan = await this.loanRepository.findOne({
      where: { loanNumber: linkDto.loanNumber },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found with the provided loan number');
    }

    // Check if loan is already linked to this customer
    const existingLink = await this.loanLinkRepository.findOne({
      where: { customerId, loanId: loan.id },
    });

    if (existingLink) {
      if (existingLink.isVerified) {
        throw new ConflictException('This loan is already linked to your account');
      }
      // If link exists but not verified, we'll update it
    }

    // Verify ownership - check if applicantId matches customer email
    let isVerified = false;
    let verificationMethod = 'LOAN_NUMBER';

    if (loan.applicantId === customerEmail) {
      // Direct match by email
      isVerified = true;
      verificationMethod = 'EMAIL_MATCH';
    } else {
      // Try to find loan application to get more customer info
      const application = await this.loanApplicationRepository.findOne({
        where: { loanId: loan.id },
      });

      // Additional verification could be added here (phone, SSN, etc.)
      // For now, if email doesn't match, we'll create an unverified link
      // Admin can verify it later, or we can add more verification steps
      
      // If customer provided email and it matches loan applicantId, verify
      if (linkDto.email && loan.applicantId === linkDto.email) {
        isVerified = true;
        verificationMethod = 'EMAIL_VERIFICATION';
      }
    }

    // Store verification data for admin review
    const verificationData: Record<string, any> = {};
    if (linkDto.phoneNumber) verificationData.phoneNumber = linkDto.phoneNumber;
    if (linkDto.ssnLast4) verificationData.ssnLast4 = linkDto.ssnLast4;
    if (linkDto.email) verificationData.providedEmail = linkDto.email;

    // Create or update the link
    const link = existingLink || this.loanLinkRepository.create({
      customerId,
      loanId: loan.id,
      isVerified,
      verificationMethod,
      verifiedAt: isVerified ? new Date() : null,
      verifiedBy: isVerified ? customerId : null,
      verificationData: Object.keys(verificationData).length > 0 ? verificationData : null,
    });

    if (isVerified && !link.isVerified) {
      link.isVerified = true;
      link.verificationMethod = verificationMethod;
      link.verifiedAt = new Date();
      link.verifiedBy = customerId;
    } else if (!isVerified && !link.verificationData) {
      // Store verification data for unverified links
      link.verificationData = verificationData;
    }

    const savedLink = await this.loanLinkRepository.save(link);

    this.logger.log(`Loan ${loan.loanNumber} linked to customer ${customerEmail} (verified: ${isVerified})`);

    return { loan, link: savedLink };
  }

  async unlinkLoan(customerId: string, loanId: string): Promise<void> {
    const link = await this.loanLinkRepository.findOne({
      where: { customerId, loanId },
    });

    if (!link) {
      throw new NotFoundException('Loan link not found');
    }

    await this.loanLinkRepository.remove(link);
    this.logger.log(`Loan ${loanId} unlinked from customer ${customerId}`);
  }

  async verifyMfaLogin(tempToken: string, mfaToken: string): Promise<{ access_token: string; user: Partial<CustomerPortalUser> }> {
    try {
      // Verify temporary token
      let tempPayload: any;
      try {
        tempPayload = this.jwtService.verify(tempToken);
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired login session. Please login again.');
      }

      if (tempPayload.type !== 'customer_mfa_pending') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.customerUserRepository.findOne({
        where: { id: tempPayload.sub },
      });

      if (!user || !user.isMfaEnabled || !user.mfaSecret) {
        throw new UnauthorizedException('MFA is not enabled for this account');
      }

      // Verify MFA token
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 2,
      });

      if (!verified) {
        this.logger.warn(`MFA verification failed for user ${user.email}`);
        throw new UnauthorizedException('Invalid MFA token. Please try again.');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.customerUserRepository.save(user);

      // Generate final JWT token
      const payload = {
        email: user.email,
        sub: user.id,
        type: 'customer',
        name: user.name,
      };
      const access_token = this.jwtService.sign(payload);

      const { password: _, ...userWithoutPassword } = user;

      this.logger.log(`MFA login successful: ${user.email}`);

      return {
        access_token,
        user: userWithoutPassword,
      };
    } catch (error) {
      this.logger.error(`MFA login verification error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Schedule a payment
   */
  async schedulePayment(
    dto: SchedulePaymentDto,
    customerEmail: string,
    customerId: string,
  ): Promise<ScheduledPayment> {
    // Verify loan belongs to customer
    const loan = await this.getMyLoan(dto.loanId, customerEmail, customerId);

    // Get customer user
    const customer = await this.customerUserRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Calculate payment amount
    const calculatedAmount = await this.calculatePaymentAmount(
      dto.loanId,
      dto.amountType,
      dto.customAmount,
    );

    // Validate scheduled date is in the future
    const scheduledDate = new Date(dto.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduledDate < today) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    // Create scheduled payment
    const scheduledPayment = this.scheduledPaymentRepository.create({
      loanId: dto.loanId,
      customerId: customerId,
      amountType: dto.amountType,
      customAmount: dto.customAmount || null,
      calculatedAmount,
      scheduledDate,
      paymentMethod: dto.paymentMethod,
      paymentMethodId: dto.paymentMethodId || null,
      bankAccountLast4: dto.bankAccountLast4 || null,
      bankRoutingNumber: dto.bankRoutingNumber || null,
      cardLast4: dto.cardLast4 || null,
      status: ScheduledPaymentStatus.PENDING,
      notes: dto.notes || null,
    });

    const saved = await this.scheduledPaymentRepository.save(scheduledPayment);

    // Send notification
    await this.notificationService.sendNotification({
      recipientId: customerId,
      notificationType: NotificationType.PAYMENT_SCHEDULED,
      channel: NotificationChannel.EMAIL,
      subject: 'Payment Scheduled',
      body: `Your payment of $${calculatedAmount.toFixed(2)} has been scheduled for ${format(scheduledDate, 'MMM d, yyyy')}`,
      metadata: {
        recipientEmail: customerEmail,
        loanId: dto.loanId,
        scheduledPaymentId: saved.id,
        amount: calculatedAmount,
        scheduledDate: scheduledDate.toISOString(),
      },
    });

    return saved;
  }

  /**
   * Calculate payment amount based on type
   */
  private async calculatePaymentAmount(
    loanId: string,
    amountType: PaymentAmountType,
    customAmount?: number,
  ): Promise<number> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['loanProduct'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    switch (amountType) {
      case PaymentAmountType.MINIMUM:
        // Get minimum payment from next installment
        const nextSchedule = await this.scheduleRepository.findOne({
          where: { loanId, status: 'Pending' as any },
          order: { paymentDate: 'ASC' },
        });
        return nextSchedule ? Number(nextSchedule.totalPayment) : 0;

      case PaymentAmountType.FULL_BALANCE:
        // Current balance
        const currentBalance =
          Number(loan.loanAmount) - Number(loan.totalPrincipalPaid);
        return Math.max(0, currentBalance);

      case PaymentAmountType.NEXT_INSTALLMENT:
        // Next installment amount
        const nextInstallment = await this.scheduleRepository.findOne({
          where: { loanId, status: 'Pending' as any },
          order: { paymentDate: 'ASC' },
        });
        return nextInstallment ? Number(nextInstallment.totalPayment) : 0;

      case PaymentAmountType.CUSTOM:
        if (!customAmount || customAmount <= 0) {
          throw new BadRequestException('Custom amount must be greater than 0');
        }
        return customAmount;

      default:
        throw new BadRequestException('Invalid payment amount type');
    }
  }

  /**
   * Get scheduled payments for a loan
   */
  async getScheduledPayments(
    loanId: string,
    customerEmail: string,
    customerId?: string,
  ): Promise<ScheduledPayment[]> {
    // Verify loan belongs to customer
    await this.getMyLoan(loanId, customerEmail, customerId);

    return await this.scheduledPaymentRepository.find({
      where: {
        loanId,
        customerId: customerId || undefined,
        status: In([
          ScheduledPaymentStatus.PENDING,
          ScheduledPaymentStatus.PROCESSING,
        ]),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  /**
   * Cancel a scheduled payment
   */
  async cancelScheduledPayment(
    scheduledPaymentId: string,
    dto: CancelScheduledPaymentDto,
    customerEmail: string,
    customerId: string,
  ): Promise<ScheduledPayment> {
    const scheduledPayment = await this.scheduledPaymentRepository.findOne({
      where: { id: scheduledPaymentId },
      relations: ['loan'],
    });

    if (!scheduledPayment) {
      throw new NotFoundException('Scheduled payment not found');
    }

    // Verify it belongs to customer
    if (scheduledPayment.customerId !== customerId) {
      throw new UnauthorizedException('Not authorized to cancel this payment');
    }

    // Verify loan belongs to customer
    await this.getMyLoan(scheduledPayment.loanId, customerEmail, customerId);

    // Check if can be cancelled
    if (scheduledPayment.status === ScheduledPaymentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed payment');
    }

    if (scheduledPayment.status === ScheduledPaymentStatus.CANCELLED) {
      throw new BadRequestException('Payment is already cancelled');
    }

    // Cancel the payment
    scheduledPayment.status = ScheduledPaymentStatus.CANCELLED;
    scheduledPayment.cancelledAt = new Date();
    scheduledPayment.cancellationReason = dto.reason || null;

    const saved = await this.scheduledPaymentRepository.save(scheduledPayment);

    // Send notification
    await this.notificationService.sendNotification({
      recipientId: customerId,
      notificationType: NotificationType.PAYMENT_FAILED,
      channel: NotificationChannel.EMAIL,
      subject: 'Payment Cancelled',
      body: `Your scheduled payment of $${scheduledPayment.calculatedAmount.toFixed(2)} for ${format(scheduledPayment.scheduledDate, 'MMM d, yyyy')} has been cancelled`,
      metadata: {
        recipientEmail: customerEmail,
        loanId: scheduledPayment.loanId,
        scheduledPaymentId: saved.id,
      },
    });

    return saved;
  }

  // Loan Application Methods for Customers

  async getAvailableCompanies(): Promise<Company[]> {
    return this.companyRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getLoanProductsByCompany(companyId: string): Promise<LoanProduct[]> {
    return this.loanProductRepository.find({
      where: { companyId, disabled: false },
      order: { productName: 'ASC' },
    });
  }

  async submitApplication(customerId: string, dto: CreateLoanApplicationDto): Promise<LoanApplication> {
    // Ensure the applicantId is the customer's ID
    const applicationDto = {
      ...dto,
      applicantId: customerId,
      applicantType: 'Customer' as any,
    };

    return this.loanApplicationService.create(applicationDto, dto.companyId);
  }

  async getMyApplications(customerId: string): Promise<LoanApplication[]> {
    return this.loanApplicationRepository.find({
      where: { applicantId: customerId },
      order: { createdAt: 'DESC' },
    });
  }
}


