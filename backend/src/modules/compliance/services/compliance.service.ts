import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { LoanApplicationDocument } from '../../loan-application-document/entities/loan-application-document.entity';
import { KYCScreening, ScreeningType, ScreeningStatus, MatchSeverity } from '../entities/kyc-screening.entity';
import { PrivacyConsent, ConsentType, ConsentStatus } from '../entities/privacy-consent.entity';
import { PrivacyRequest, RequestType, RequestStatus } from '../entities/privacy-consent.entity';
import { AuditLog, AuditEventType, AuditEntityType } from '../entities/audit-log.entity';
import { DocumentRetention, RetentionCategory, RetentionStatus, HoldType } from '../entities/document-retention.entity';
import { PerformScreeningDto, InvestigateMatchDto, FileSARDto, ResolveScreeningDto } from '../dto/kyc-screening.dto';
import { CreateConsentDto, WithdrawConsentDto, CreatePrivacyRequestDto, ProcessPrivacyRequestDto, CompletePrivacyRequestDto, RejectPrivacyRequestDto } from '../dto/privacy-consent.dto';
import { QueryAuditLogsDto } from '../dto/audit-log.dto';
import { CreateRetentionRecordDto, PlaceLegalHoldDto, ReleaseLegalHoldDto, ArchiveDocumentDto, PurgeDocumentDto } from '../dto/document-retention.dto';

/**
 * Compliance Service
 * UC-044: KYC/AML Screening
 * UC-045: Privacy Consent Management
 * UC-046: Audit Trail Review
 * UC-047: Document Retention Management
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(LoanApplicationDocument)
    private readonly documentRepository: Repository<LoanApplicationDocument>,
    @InjectRepository(KYCScreening)
    private readonly kycScreeningRepository: Repository<KYCScreening>,
    @InjectRepository(PrivacyConsent)
    private readonly privacyConsentRepository: Repository<PrivacyConsent>,
    @InjectRepository(PrivacyRequest)
    private readonly privacyRequestRepository: Repository<PrivacyRequest>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(DocumentRetention)
    private readonly documentRetentionRepository: Repository<DocumentRetention>,
  ) {}

  /**
   * UC-044: KYC/AML Screening
   * Performs screening against OFAC, sanctions lists, PEP databases, etc.
   */
  async performScreening(dto: PerformScreeningDto, userId: string, userName: string): Promise<KYCScreening> {
    const application = await this.applicationRepository.findOne({ where: { id: dto.applicationId } });
    if (!application) {
      throw new Error('Loan application not found');
    }

    const screeningDate = dto.screeningDate ? new Date(dto.screeningDate) : new Date();
    const screeningType = dto.screeningType || ScreeningType.OFAC;

    // Simulate screening against external databases
    // In production, this would call external APIs (OFAC, PEP databases, etc.)
    const matches = await this.simulateScreening(application, screeningType);

    const matchFound = matches.length > 0;
    const matchCount = matches.length;
    const matchSeverity = this.determineMatchSeverity(matches);

    const screening = this.kycScreeningRepository.create({
      applicationId: dto.applicationId,
      screeningType,
      screeningDate,
      status: matchFound ? ScreeningStatus.FLAGGED : ScreeningStatus.CLEARED,
      matchFound,
      matchCount,
      matchSeverity,
      matches,
      screeningData: {
        applicationData: {
          applicantId: application.applicantId,
          applicantType: application.applicantType,
          applicationNumber: application.applicationNumber,
        },
        screeningTimestamp: new Date().toISOString(),
      },
    });

    return await this.kycScreeningRepository.save(screening);
  }

  private async simulateScreening(application: LoanApplication, screeningType: ScreeningType): Promise<any[]> {
    // Simulate screening - in production, this would call external APIs
    const matches: any[] = [];

    // Example: Check for common patterns that might match sanctions lists
    // In production, this would call external APIs with applicantId
    const applicantId = application.applicantId?.toLowerCase() || '';
    const suspiciousPatterns = ['test', 'sanction', 'pep']; // Simplified for demo

    for (const pattern of suspiciousPatterns) {
      if (applicantId.includes(pattern)) {
        matches.push({
          type: screeningType,
          matchScore: 0.85,
          matchedId: application.applicantId,
          source: `${screeningType} Database`,
          details: `Potential match found in ${screeningType} database`,
        });
      }
    }

    return matches;
  }

  private determineMatchSeverity(matches: any[]): MatchSeverity {
    if (matches.length === 0) return MatchSeverity.LOW;
    
    const avgScore = matches.reduce((sum, m) => sum + (m.matchScore || 0), 0) / matches.length;
    
    if (avgScore >= 0.9) return MatchSeverity.CRITICAL;
    if (avgScore >= 0.7) return MatchSeverity.HIGH;
    if (avgScore >= 0.5) return MatchSeverity.MEDIUM;
    return MatchSeverity.LOW;
  }

  async investigateMatch(id: string, dto: InvestigateMatchDto, userId: string, userName: string): Promise<KYCScreening> {
    const screening = await this.kycScreeningRepository.findOne({ where: { id } });
    if (!screening) {
      throw new Error('KYC screening not found');
    }

    screening.status = ScreeningStatus.IN_PROGRESS;
    screening.investigatedBy = userId;
    screening.investigatedAt = new Date();
    screening.investigationNotes = dto.investigationNotes;
    screening.requiresSAR = dto.requiresSAR || false;

    return await this.kycScreeningRepository.save(screening);
  }

  async fileSAR(id: string, dto: FileSARDto, userId: string, userName: string): Promise<KYCScreening> {
    const screening = await this.kycScreeningRepository.findOne({ where: { id } });
    if (!screening) {
      throw new Error('KYC screening not found');
    }

    screening.sarFiled = true;
    screening.sarFiledBy = userId;
    screening.sarFiledAt = new Date();
    screening.sarReference = dto.sarReference;
    screening.sarNotes = dto.sarNotes;
    screening.status = ScreeningStatus.SAR_FILED;

    return await this.kycScreeningRepository.save(screening);
  }

  async resolveScreening(id: string, dto: ResolveScreeningDto, userId: string, userName: string): Promise<KYCScreening> {
    const screening = await this.kycScreeningRepository.findOne({ where: { id } });
    if (!screening) {
      throw new Error('KYC screening not found');
    }

    screening.status = ScreeningStatus.CLEARED;
    screening.resolvedBy = userId;
    screening.resolvedAt = new Date();
    screening.resolutionNotes = dto.resolutionNotes;
    screening.remarks = dto.remarks;

    return await this.kycScreeningRepository.save(screening);
  }

  /**
   * UC-045: Privacy Consent Management
   */
  async createConsent(dto: CreateConsentDto, userId: string, userName: string): Promise<PrivacyConsent> {
    const consent = this.privacyConsentRepository.create({
      applicationId: dto.applicationId,
      customerId: dto.customerId,
      consentType: dto.consentType,
      consentDate: new Date(),
      status: dto.status,
      consentText: dto.consentText,
      explicitConsent: dto.explicitConsent || false,
    });

    return await this.privacyConsentRepository.save(consent);
  }

  async withdrawConsent(id: string, dto: WithdrawConsentDto, userId: string, userName: string): Promise<PrivacyConsent> {
    const consent = await this.privacyConsentRepository.findOne({ where: { id } });
    if (!consent) {
      throw new Error('Privacy consent not found');
    }

    consent.status = ConsentStatus.WITHDRAWN;
    consent.withdrawnAt = new Date();
    consent.withdrawalReason = dto.withdrawalReason;

    return await this.privacyConsentRepository.save(consent);
  }

  async createPrivacyRequest(dto: CreatePrivacyRequestDto, userId: string, userName: string): Promise<PrivacyRequest> {
    const request = this.privacyRequestRepository.create({
      customerId: dto.customerId,
      requestType: dto.requestType,
      requestDate: new Date(),
      status: RequestStatus.PENDING,
      description: dto.description,
      requestDetails: dto.requestDetails,
    });

    return await this.privacyRequestRepository.save(request);
  }

  async processPrivacyRequest(id: string, dto: ProcessPrivacyRequestDto, userId: string, userName: string): Promise<PrivacyRequest> {
    const request = await this.privacyRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new Error('Privacy request not found');
    }

    request.status = RequestStatus.IN_PROGRESS;
    request.processedBy = userId;
    request.processedAt = new Date();
    request.processingNotes = dto.processingNotes;
    request.responseData = dto.responseData;

    return await this.privacyRequestRepository.save(request);
  }

  async completePrivacyRequest(id: string, dto: CompletePrivacyRequestDto, userId: string, userName: string): Promise<PrivacyRequest> {
    const request = await this.privacyRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new Error('Privacy request not found');
    }

    request.status = RequestStatus.COMPLETED;
    request.completedAt = new Date();
    request.remarks = dto.remarks;

    return await this.privacyRequestRepository.save(request);
  }

  async rejectPrivacyRequest(id: string, dto: RejectPrivacyRequestDto, userId: string, userName: string): Promise<PrivacyRequest> {
    const request = await this.privacyRequestRepository.findOne({ where: { id } });
    if (!request) {
      throw new Error('Privacy request not found');
    }

    request.status = RequestStatus.REJECTED;
    request.rejectionReason = dto.rejectionReason;

    return await this.privacyRequestRepository.save(request);
  }

  /**
   * UC-046: Audit Trail Review
   */
  async queryAuditLogs(dto: QueryAuditLogsDto): Promise<{ logs: AuditLog[]; total: number; page: number; limit: number }> {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (dto.userId) {
      query.andWhere('log.userId = :userId', { userId: dto.userId });
    }

    if (dto.eventType) {
      query.andWhere('log.eventType = :eventType', { eventType: dto.eventType });
    }

    if (dto.entityType) {
      query.andWhere('log.entityType = :entityType', { entityType: dto.entityType });
    }

    if (dto.entityId) {
      query.andWhere('log.entityId = :entityId', { entityId: dto.entityId });
    }

    if (dto.fromDate && dto.toDate) {
      query.andWhere('log.timestamp BETWEEN :fromDate AND :toDate', {
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
      });
    }

    if (dto.ipAddress) {
      query.andWhere('log.ipAddress = :ipAddress', { ipAddress: dto.ipAddress });
    }

    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;

    query.orderBy('log.timestamp', 'DESC');
    query.skip(skip);
    query.take(limit);

    const [logs, total] = await query.getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  async createAuditLog(
    eventType: AuditEventType,
    entityType: AuditEntityType,
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    userEmail: string,
    description: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      userId,
      userName,
      userEmail,
      eventType,
      entityType,
      entityId,
      entityName,
      description,
      oldValues,
      newValues,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    return await this.auditLogRepository.save(log);
  }

  /**
   * UC-047: Document Retention Management
   */
  async createRetentionRecord(dto: CreateRetentionRecordDto, userId: string, userName: string): Promise<DocumentRetention> {
    const documentDate = new Date(dto.documentDate);
    const retentionExpiryDate = new Date(documentDate);
    retentionExpiryDate.setFullYear(retentionExpiryDate.getFullYear() + dto.retentionPeriodYears);

    const retention = this.documentRetentionRepository.create({
      documentId: dto.documentId,
      documentType: dto.documentType,
      documentPath: dto.documentPath,
      retentionCategory: dto.retentionCategory,
      documentDate,
      retentionPeriodYears: dto.retentionPeriodYears,
      retentionExpiryDate,
      status: RetentionStatus.ACTIVE,
    });

    return await this.documentRetentionRepository.save(retention);
  }

  async placeLegalHold(id: string, dto: PlaceLegalHoldDto, userId: string, userName: string): Promise<DocumentRetention> {
    const retention = await this.documentRetentionRepository.findOne({ where: { id } });
    if (!retention) {
      throw new Error('Document retention record not found');
    }

    retention.onLegalHold = true;
    retention.holdType = dto.holdType;
    retention.holdReason = dto.holdReason;
    retention.holdPlacedBy = userId;
    retention.holdPlacedAt = new Date();
    retention.holdExpiryDate = dto.holdExpiryDate ? new Date(dto.holdExpiryDate) : null;
    retention.status = RetentionStatus.LEGAL_HOLD;

    return await this.documentRetentionRepository.save(retention);
  }

  async releaseLegalHold(id: string, dto: ReleaseLegalHoldDto, userId: string, userName: string): Promise<DocumentRetention> {
    const retention = await this.documentRetentionRepository.findOne({ where: { id } });
    if (!retention) {
      throw new Error('Document retention record not found');
    }

    retention.onLegalHold = false;
    retention.holdReleasedBy = userId;
    retention.holdReleasedAt = new Date();
    retention.remarks = dto.remarks;

    // Determine new status based on retention expiry
    const now = new Date();
    if (retention.retentionExpiryDate < now) {
      retention.status = RetentionStatus.PENDING_PURGE;
    } else {
      retention.status = retention.archived ? RetentionStatus.ARCHIVED : RetentionStatus.ACTIVE;
    }

    return await this.documentRetentionRepository.save(retention);
  }

  async archiveDocument(id: string, dto: ArchiveDocumentDto, userId: string, userName: string): Promise<DocumentRetention> {
    const retention = await this.documentRetentionRepository.findOne({ where: { id } });
    if (!retention) {
      throw new Error('Document retention record not found');
    }

    retention.archived = true;
    retention.archivedBy = userId;
    retention.archivedAt = new Date();
    retention.archiveLocation = dto.archiveLocation;
    retention.status = RetentionStatus.ARCHIVED;
    retention.remarks = dto.remarks;

    return await this.documentRetentionRepository.save(retention);
  }

  async purgeDocument(id: string, dto: PurgeDocumentDto, userId: string, userName: string): Promise<DocumentRetention> {
    const retention = await this.documentRetentionRepository.findOne({ where: { id } });
    if (!retention) {
      throw new Error('Document retention record not found');
    }

    if (retention.onLegalHold) {
      throw new Error('Cannot purge document on legal hold');
    }

    const now = new Date();
    if (retention.retentionExpiryDate > now) {
      throw new Error('Retention period has not expired');
    }

    retention.purged = true;
    retention.purgedBy = userId;
    retention.purgedAt = new Date();
    retention.purgeConfirmation = dto.purgeConfirmation;
    retention.status = RetentionStatus.PURGED;
    retention.remarks = dto.remarks;

    return await this.documentRetentionRepository.save(retention);
  }

  // Query methods
  async getKYCScreenings(filters: {
    applicationId?: string;
    screeningType?: ScreeningType;
    status?: ScreeningStatus;
  }): Promise<KYCScreening[]> {
    const query = this.kycScreeningRepository.createQueryBuilder('screening');

    if (filters.applicationId) {
      query.andWhere('screening.applicationId = :applicationId', { applicationId: filters.applicationId });
    }

    if (filters.screeningType) {
      query.andWhere('screening.screeningType = :screeningType', { screeningType: filters.screeningType });
    }

    if (filters.status) {
      query.andWhere('screening.status = :status', { status: filters.status });
    }

    query.orderBy('screening.screeningDate', 'DESC');

    return await query.getMany();
  }

  async getPrivacyConsents(filters: {
    applicationId?: string;
    customerId?: string;
    consentType?: ConsentType;
    status?: ConsentStatus;
  }): Promise<PrivacyConsent[]> {
    const query = this.privacyConsentRepository.createQueryBuilder('consent');

    if (filters.applicationId) {
      query.andWhere('consent.applicationId = :applicationId', { applicationId: filters.applicationId });
    }

    if (filters.customerId) {
      query.andWhere('consent.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.consentType) {
      query.andWhere('consent.consentType = :consentType', { consentType: filters.consentType });
    }

    if (filters.status) {
      query.andWhere('consent.status = :status', { status: filters.status });
    }

    query.orderBy('consent.consentDate', 'DESC');

    return await query.getMany();
  }

  async getPrivacyRequests(filters: {
    customerId?: string;
    requestType?: RequestType;
    status?: RequestStatus;
  }): Promise<PrivacyRequest[]> {
    const query = this.privacyRequestRepository.createQueryBuilder('request');

    if (filters.customerId) {
      query.andWhere('request.customerId = :customerId', { customerId: filters.customerId });
    }

    if (filters.requestType) {
      query.andWhere('request.requestType = :requestType', { requestType: filters.requestType });
    }

    if (filters.status) {
      query.andWhere('request.status = :status', { status: filters.status });
    }

    query.orderBy('request.requestDate', 'DESC');

    return await query.getMany();
  }

  async getDocumentRetentions(filters: {
    documentId?: string;
    retentionCategory?: RetentionCategory;
    status?: RetentionStatus;
    onLegalHold?: boolean;
  }): Promise<DocumentRetention[]> {
    const query = this.documentRetentionRepository.createQueryBuilder('retention');

    if (filters.documentId) {
      query.andWhere('retention.documentId = :documentId', { documentId: filters.documentId });
    }

    if (filters.retentionCategory) {
      query.andWhere('retention.retentionCategory = :retentionCategory', { retentionCategory: filters.retentionCategory });
    }

    if (filters.status) {
      query.andWhere('retention.status = :status', { status: filters.status });
    }

    if (filters.onLegalHold !== undefined) {
      query.andWhere('retention.onLegalHold = :onLegalHold', { onLegalHold: filters.onLegalHold });
    }

    query.orderBy('retention.retentionExpiryDate', 'ASC');

    return await query.getMany();
  }
}

