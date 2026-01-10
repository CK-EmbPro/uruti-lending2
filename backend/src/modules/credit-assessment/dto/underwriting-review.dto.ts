import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus, ReviewPriority } from '../entities/underwriting-review.entity';

export class CreateUnderwritingReviewDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid-application-1' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Reviewer user ID', example: 'uuid-user-1' })
  @IsString()
  @IsOptional()
  reviewerId?: string;

  @ApiPropertyOptional({ description: 'Review priority', enum: ReviewPriority, default: ReviewPriority.MEDIUM })
  @IsEnum(ReviewPriority)
  @IsOptional()
  priority?: ReviewPriority;
}

export class UpdateUnderwritingReviewDto {
  @ApiPropertyOptional({ description: 'Financial analysis', example: 'Strong income stability' })
  @IsString()
  @IsOptional()
  financialAnalysis?: string;

  @ApiPropertyOptional({ description: 'Risk assessment', example: 'Low to moderate risk' })
  @IsString()
  @IsOptional()
  riskAssessment?: string;

  @ApiPropertyOptional({ description: 'Additional information requested', example: ['Bank statements', 'Tax returns'] })
  @IsArray()
  @IsOptional()
  additionalInfoRequested?: string[];

  @ApiPropertyOptional({ description: 'Decision', example: 'Approve with conditions' })
  @IsString()
  @IsOptional()
  decision?: string;

  @ApiPropertyOptional({ description: 'Decision rationale', example: 'Applicant has strong credit history' })
  @IsString()
  @IsOptional()
  decisionRationale?: string;

  @ApiPropertyOptional({ description: 'Risk factors', example: { debtRatio: 0.4, creditScore: 720 } })
  @IsObject()
  @IsOptional()
  riskFactors?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Recommendations', example: { approve: true, conditions: ['Co-signer'] } })
  @IsObject()
  @IsOptional()
  recommendations?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Escalate to user ID', example: 'uuid-user-2' })
  @IsString()
  @IsOptional()
  escalatedTo?: string;

  @ApiPropertyOptional({ description: 'Escalation reason', example: 'Complex financial structure' })
  @IsString()
  @IsOptional()
  escalationReason?: string;

  @ApiPropertyOptional({ description: 'Requires peer review', default: false })
  @IsBoolean()
  @IsOptional()
  requiresPeerReview?: boolean;

  @ApiPropertyOptional({ description: 'Peer reviewer user ID', example: 'uuid-user-3' })
  @IsString()
  @IsOptional()
  peerReviewerId?: string;

  @ApiPropertyOptional({ description: 'Review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;
}

