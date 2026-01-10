import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FraudAlert, FraudAlertStatus, FraudAlertSeverity } from '../entities/fraud-alert.entity';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { CreateFraudAlertDto, UpdateFraudAlertDto } from '../dto/fraud-alert.dto';

/**
 * Service for fraud detection and investigation
 * UC-009: Fraud Detection Alert
 */
@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(FraudAlert)
    private readonly fraudAlertRepository: Repository<FraudAlert>,
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
  ) {}

  /**
   * Detect suspicious patterns in an application
   * This would typically be called automatically when an application is submitted
   */
  async detectFraud(applicationId: string): Promise<FraudAlert | null> {
    const application = await this.applicationRepository.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${applicationId} not found`);
    }

    // Check if alert already exists
    const existingAlert = await this.fraudAlertRepository.findOne({
      where: { applicationId, status: FraudAlertStatus.PENDING },
    });

    if (existingAlert) {
      return existingAlert;
    }

    // Run fraud detection checks
    const suspiciousPatterns = await this.runFraudChecks(application);

    if (Object.keys(suspiciousPatterns).length === 0) {
      return null; // No fraud detected
    }

    // Determine alert type and severity
    const { alertType, severity, description } = this.analyzePatterns(suspiciousPatterns);

    // Create fraud alert
    const alert = this.fraudAlertRepository.create({
      applicationId: application.id,
      status: FraudAlertStatus.PENDING,
      severity,
      alertType,
      description,
      detectedPatterns: suspiciousPatterns,
      detectedDate: new Date(),
    });

    const savedAlert = await this.fraudAlertRepository.save(alert);

    this.logger.warn(
      `Fraud alert created for application ${application.applicationNumber}: ${alertType} (${severity})`,
    );

    return savedAlert;
  }

  /**
   * Run fraud detection checks
   */
  private async runFraudChecks(application: LoanApplication): Promise<Record<string, any>> {
    const patterns: Record<string, any> = {};

    // Check 1: Identity verification (mocked - in production, integrate with identity verification services)
    const identityCheck = await this.checkIdentity(application);
    if (!identityCheck.verified) {
      patterns.identityMismatch = {
        detected: true,
        reason: identityCheck.reason,
        confidence: identityCheck.confidence,
      };
    }

    // Check 2: Document authenticity (mocked - in production, use OCR and document verification)
    const documentCheck = await this.checkDocuments(application);
    if (documentCheck.suspicious) {
      patterns.documentFraud = {
        detected: true,
        issues: documentCheck.issues,
        confidence: documentCheck.confidence,
      };
    }

    // Check 3: Income verification
    const incomeCheck = await this.checkIncome(application);
    if (incomeCheck.hasDiscrepancy) {
      patterns.incomeDiscrepancy = {
        detected: true,
        discrepancy: incomeCheck.discrepancyReason,
        confidence: incomeCheck.confidence,
      };
    }

    // Check 4: Application velocity (multiple applications in short time)
    const velocityCheck = await this.checkApplicationVelocity(application);
    if (velocityCheck.suspicious) {
      patterns.highVelocity = {
        detected: true,
        applications: velocityCheck.count,
        timeFrame: velocityCheck.timeFrame,
      };
    }

    // Check 5: Address verification
    const addressCheck = await this.checkAddress(application);
    if (addressCheck.suspicious) {
      patterns.addressMismatch = {
        detected: true,
        reason: addressCheck.reason,
      };
    }

    return patterns;
  }

  /**
   * Check identity verification
   */
  private async checkIdentity(application: LoanApplication): Promise<{
    verified: boolean;
    reason?: string;
    confidence: number;
  }> {
    // Mock check - in production, integrate with identity verification services
    // This would check name matching, SSN verification, etc.
    const random = Math.random();
    if (random < 0.1) {
      // 10% chance of identity mismatch
      return {
        verified: false,
        reason: 'Name on application does not match ID document',
        confidence: 0.85,
      };
    }
    return { verified: true, confidence: 0.95 };
  }

  /**
   * Check document authenticity
   */
  private async checkDocuments(application: LoanApplication): Promise<{
    suspicious: boolean;
    issues?: string[];
    confidence: number;
  }> {
    // Mock check - in production, use OCR and document verification services
    const random = Math.random();
    if (random < 0.08) {
      // 8% chance of document fraud
      return {
        suspicious: true,
        issues: ['Document appears altered', 'Inconsistent formatting'],
        confidence: 0.80,
      };
    }
    return { suspicious: false, confidence: 0.90 };
  }

  /**
   * Check income verification
   */
  private async checkIncome(application: LoanApplication): Promise<{
    hasDiscrepancy: boolean;
    discrepancyReason?: string;
    confidence: number;
  }> {
    // Mock check - in production, verify against tax returns, bank statements
    const random = Math.random();
    if (random < 0.12) {
      // 12% chance of income discrepancy
      return {
        hasDiscrepancy: true,
        discrepancyReason: 'Reported income significantly higher than tax records',
        confidence: 0.75,
      };
    }
    return { hasDiscrepancy: false, confidence: 0.88 };
  }

  /**
   * Check application velocity
   */
  private async checkApplicationVelocity(application: LoanApplication): Promise<{
    suspicious: boolean;
    count?: number;
    timeFrame?: string;
  }> {
    // Mock check - in production, query database for recent applications
    const random = Math.random();
    if (random < 0.05) {
      // 5% chance of high velocity
      return {
        suspicious: true,
        count: 5,
        timeFrame: '30 days',
      };
    }
    return { suspicious: false };
  }

  /**
   * Check address verification
   */
  private async checkAddress(application: LoanApplication): Promise<{
    suspicious: boolean;
    reason?: string;
  }> {
    // Mock check - in production, verify address against postal services
    const random = Math.random();
    if (random < 0.06) {
      // 6% chance of address mismatch
      return {
        suspicious: true,
        reason: 'Address does not match public records',
      };
    }
    return { suspicious: false };
  }

  /**
   * Analyze patterns and determine alert type and severity
   */
  private analyzePatterns(patterns: Record<string, any>): {
    alertType: string;
    severity: FraudAlertSeverity;
    description: string;
  } {
    const patternKeys = Object.keys(patterns);
    const criticalPatterns = ['identityMismatch', 'documentFraud'];
    const highPatterns = ['incomeDiscrepancy', 'addressMismatch'];
    const mediumPatterns = ['highVelocity'];

    let severity: FraudAlertSeverity = FraudAlertSeverity.LOW;
    let alertType = 'Suspicious Activity';
    let description = 'Multiple suspicious patterns detected';

    if (patternKeys.some((key) => criticalPatterns.includes(key))) {
      severity = FraudAlertSeverity.CRITICAL;
      alertType = patternKeys.find((key) => criticalPatterns.includes(key)) === 'identityMismatch'
        ? 'Identity Mismatch'
        : 'Document Fraud';
      description = `Critical fraud indicator: ${alertType}`;
    } else if (patternKeys.some((key) => highPatterns.includes(key))) {
      severity = FraudAlertSeverity.HIGH;
      alertType = patternKeys.find((key) => highPatterns.includes(key)) === 'incomeDiscrepancy'
        ? 'Income Discrepancy'
        : 'Address Mismatch';
      description = `High-risk fraud indicator: ${alertType}`;
    } else if (patternKeys.some((key) => mediumPatterns.includes(key))) {
      severity = FraudAlertSeverity.MEDIUM;
      alertType = 'Application Velocity';
      description = 'Unusual application pattern detected';
    } else {
      severity = FraudAlertSeverity.LOW;
      alertType = 'Suspicious Activity';
      description = 'Minor suspicious patterns detected';
    }

    return { alertType, severity, description };
  }

  /**
   * Assign alert to fraud analyst
   */
  async assignAlert(alertId: string, assignedTo: string): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new NotFoundException(`Fraud alert with ID ${alertId} not found`);
    }

    alert.assignedTo = assignedTo;
    alert.status = FraudAlertStatus.INVESTIGATING;

    return await this.fraudAlertRepository.save(alert);
  }

  /**
   * Update fraud alert investigation
   */
  async updateInvestigation(alertId: string, updateDto: UpdateFraudAlertDto): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new NotFoundException(`Fraud alert with ID ${alertId} not found`);
    }

    Object.assign(alert, updateDto);
    return await this.fraudAlertRepository.save(alert);
  }

  /**
   * Resolve fraud alert
   */
  async resolveAlert(
    alertId: string,
    resolution: string,
    isFalsePositive: boolean = false,
    reportedToLawEnforcement: boolean = false,
  ): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new NotFoundException(`Fraud alert with ID ${alertId} not found`);
    }

    alert.status = isFalsePositive ? FraudAlertStatus.FALSE_POSITIVE : FraudAlertStatus.RESOLVED;
    alert.resolution = resolution;
    alert.resolvedDate = new Date();
    alert.reportedToLawEnforcement = reportedToLawEnforcement;

    if (isFalsePositive) {
      alert.status = FraudAlertStatus.FALSE_POSITIVE;
    } else if (reportedToLawEnforcement) {
      alert.status = FraudAlertStatus.CONFIRMED;
    }

    return await this.fraudAlertRepository.save(alert);
  }

  /**
   * Get fraud alert by ID
   */
  async getAlert(alertId: string): Promise<FraudAlert> {
    const alert = await this.fraudAlertRepository.findOne({
      where: { id: alertId },
      relations: ['application'],
    });

    if (!alert) {
      throw new NotFoundException(`Fraud alert with ID ${alertId} not found`);
    }

    return alert;
  }

  /**
   * Get alerts for an application
   */
  async getAlertsForApplication(applicationId: string): Promise<FraudAlert[]> {
    return await this.fraudAlertRepository.find({
      where: { applicationId },
      order: { detectedDate: 'DESC' },
    });
  }

  /**
   * Get all pending alerts
   */
  async getPendingAlerts(): Promise<FraudAlert[]> {
    return await this.fraudAlertRepository.find({
      where: { status: FraudAlertStatus.PENDING },
      order: { severity: 'DESC', detectedDate: 'DESC' },
      relations: ['application'],
    });
  }
}

