import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import {
  FraudInvestigationCase,
  InvestigationStatus,
  EscalationLevel,
} from '../entities/fraud-investigation-case.entity';
import { ConfigService } from '@nestjs/config';
import { IsString, IsOptional, IsArray, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateInvestigationCaseDto {
  @ApiProperty({ description: 'Application IDs related to case', example: ['app-123', 'app-456'] })
  @IsArray()
  @IsString({ each: true })
  applicationIds: string[];

  @ApiPropertyOptional({ description: 'Cluster ID if part of fraud ring', example: 'cluster-123' })
  @IsOptional()
  @IsString()
  clusterId?: string;

  @ApiPropertyOptional({ description: 'Case description', example: 'Fraud ring detected with 5 applications' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Total fraud amount', example: 50000 })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;
}

export class UpdateInvestigationCaseDto {
  @ApiPropertyOptional({ description: 'Case status', enum: InvestigationStatus })
  @IsOptional()
  @IsEnum(InvestigationStatus)
  status?: InvestigationStatus;

  @ApiPropertyOptional({ description: 'Assigned investigator user ID', example: 'user-123' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Evidence to add' })
  @IsOptional()
  evidence?: {
    screenshots?: string[];
    recordings?: string[];
    notes?: string[];
    documents?: string[];
  };

  @ApiPropertyOptional({ description: 'Investigation findings' })
  @IsOptional()
  findings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Resolution notes', example: 'Case resolved - confirmed fraud' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

@Injectable()
export class FraudInvestigationCaseService {
  private readonly logger = new Logger(FraudInvestigationCaseService.name);
  private readonly LAW_ENFORCEMENT_THRESHOLD: number;

  constructor(
    @InjectRepository(FraudInvestigationCase)
    private readonly caseRepository: Repository<FraudInvestigationCase>,
    private readonly configService: ConfigService,
  ) {
    this.LAW_ENFORCEMENT_THRESHOLD =
      parseFloat(this.configService.get('LAW_ENFORCEMENT_THRESHOLD') || '100000') || 100000;
  }

  /**
   * Create new investigation case
   */
  async createCase(dto: CreateInvestigationCaseDto): Promise<FraudInvestigationCase> {
    const caseNumber = await this.generateCaseNumber();

    const slaDeadline = new Date();
    slaDeadline.setHours(slaDeadline.getHours() + 24); // 24 hours SLA

    const investigationCase = this.caseRepository.create({
      caseNumber,
      applicationIds: dto.applicationIds,
      clusterId: dto.clusterId,
      description: dto.description,
      totalAmount: dto.totalAmount,
      status: InvestigationStatus.OPEN,
      escalationLevel: EscalationLevel.NONE,
      slaDeadline,
      evidence: {
        screenshots: [],
        recordings: [],
        notes: [],
        documents: [],
      },
    });

    // Check if should escalate to law enforcement
    if (dto.totalAmount && dto.totalAmount >= this.LAW_ENFORCEMENT_THRESHOLD) {
      investigationCase.escalationLevel = EscalationLevel.LAW_ENFORCEMENT;
      investigationCase.lawEnforcementNotified = true;
      investigationCase.lawEnforcementNotifiedAt = new Date();
    }

    const saved = await this.caseRepository.save(investigationCase);

    this.logger.log(`Created investigation case ${caseNumber} for ${dto.applicationIds.length} applications`);

    return saved;
  }

  /**
   * Update investigation case
   */
  async updateCase(
    caseId: string,
    dto: UpdateInvestigationCaseDto,
  ): Promise<FraudInvestigationCase> {
    const investigationCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!investigationCase) {
      throw new NotFoundException(`Investigation case ${caseId} not found`);
    }

    // Update status
    if (dto.status) {
      investigationCase.status = dto.status;

      if (dto.status === InvestigationStatus.IN_PROGRESS && !investigationCase.investigationStartedAt) {
        investigationCase.investigationStartedAt = new Date();
      }

      if (
        dto.status === InvestigationStatus.RESOLVED ||
        dto.status === InvestigationStatus.CLOSED
      ) {
        investigationCase.investigationCompletedAt = new Date();
      }
    }

    // Update assignment
    if (dto.assignedTo !== undefined) {
      investigationCase.assignedTo = dto.assignedTo;
    }

    // Update evidence
    if (dto.evidence) {
      investigationCase.evidence = {
        ...investigationCase.evidence,
        ...dto.evidence,
      };
    }

    // Update findings
    if (dto.findings) {
      investigationCase.findings = {
        ...investigationCase.findings,
        ...dto.findings,
      };
    }

    // Update resolution notes
    if (dto.resolutionNotes) {
      investigationCase.resolutionNotes = dto.resolutionNotes;
    }

    return await this.caseRepository.save(investigationCase);
  }

  /**
   * Add evidence to case
   */
  async addEvidence(
    caseId: string,
    evidence: {
      screenshots?: string[];
      recordings?: string[];
      notes?: string[];
      documents?: string[];
    },
  ): Promise<FraudInvestigationCase> {
    const investigationCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!investigationCase) {
      throw new NotFoundException(`Investigation case ${caseId} not found`);
    }

    investigationCase.evidence = {
      screenshots: [
        ...(investigationCase.evidence?.screenshots || []),
        ...(evidence.screenshots || []),
      ],
      recordings: [
        ...(investigationCase.evidence?.recordings || []),
        ...(evidence.recordings || []),
      ],
      notes: [
        ...(investigationCase.evidence?.notes || []),
        ...(evidence.notes || []),
      ],
      documents: [
        ...(investigationCase.evidence?.documents || []),
        ...(evidence.documents || []),
      ],
    };

    return await this.caseRepository.save(investigationCase);
  }

  /**
   * Escalate case
   */
  async escalateCase(
    caseId: string,
    escalationLevel: EscalationLevel,
  ): Promise<FraudInvestigationCase> {
    const investigationCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!investigationCase) {
      throw new NotFoundException(`Investigation case ${caseId} not found`);
    }

    investigationCase.escalationLevel = escalationLevel;
    investigationCase.status = InvestigationStatus.ESCALATED;

    if (escalationLevel === EscalationLevel.LAW_ENFORCEMENT) {
      investigationCase.lawEnforcementNotified = true;
      investigationCase.lawEnforcementNotifiedAt = new Date();
    }

    return await this.caseRepository.save(investigationCase);
  }

  /**
   * Get case by ID
   */
  async getCase(caseId: string): Promise<FraudInvestigationCase> {
    const investigationCase = await this.caseRepository.findOne({
      where: { id: caseId },
    });

    if (!investigationCase) {
      throw new NotFoundException(`Investigation case ${caseId} not found`);
    }

    return investigationCase;
  }

  /**
   * Get all cases with filters
   */
  async getCases(filters?: {
    status?: InvestigationStatus;
    escalationLevel?: EscalationLevel;
    assignedTo?: string;
    overdue?: boolean;
  }): Promise<FraudInvestigationCase[]> {
    const queryBuilder = this.caseRepository.createQueryBuilder('case');

    if (filters?.status) {
      queryBuilder.andWhere('case.status = :status', { status: filters.status });
    }

    if (filters?.escalationLevel) {
      queryBuilder.andWhere('case.escalationLevel = :escalationLevel', {
        escalationLevel: filters.escalationLevel,
      });
    }

    if (filters?.assignedTo) {
      queryBuilder.andWhere('case.assignedTo = :assignedTo', {
        assignedTo: filters.assignedTo,
      });
    }

    if (filters?.overdue) {
      queryBuilder.andWhere('case.slaDeadline < :now', { now: new Date() });
      queryBuilder.andWhere('case.status != :closed', {
        closed: InvestigationStatus.CLOSED,
      });
    }

    queryBuilder.orderBy('case.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Calculate SLA compliance
   */
  async calculateSLACompliance(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalCases: number;
    withinSLA: number;
    complianceRate: number;
    averageResolutionTime: number;
  }> {
    const cases = await this.caseRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        investigationCompletedAt: Between(startDate, endDate),
      },
    });

    const totalCases = cases.length;
    const withinSLA = cases.filter((c) => {
      if (!c.investigationCompletedAt || !c.slaDeadline) return false;
      return c.investigationCompletedAt <= c.slaDeadline;
    }).length;

    const complianceRate = totalCases > 0 ? (withinSLA / totalCases) * 100 : 100;

    const totalResolutionTime = cases.reduce((sum, c) => {
      if (!c.investigationStartedAt || !c.investigationCompletedAt) return sum;
      return (
        sum +
        (c.investigationCompletedAt.getTime() - c.investigationStartedAt.getTime())
      );
    }, 0);

    const averageResolutionTime =
      totalCases > 0 ? totalResolutionTime / totalCases / (1000 * 60 * 60) : 0; // Hours

    return {
      totalCases,
      withinSLA,
      complianceRate: parseFloat(complianceRate.toFixed(2)),
      averageResolutionTime: parseFloat(averageResolutionTime.toFixed(2)),
    };
  }

  /**
   * Generate unique case number
   */
  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.caseRepository.count({
      where: {
        createdAt: Between(
          new Date(`${year}-01-01`),
          new Date(`${year}-12-31`),
        ),
      },
    });

    return `FRAUD-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}

