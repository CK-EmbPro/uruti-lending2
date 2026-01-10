import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OverrideApprovalStatus } from '../entities/override-approval.entity';

export class ApproveOverrideDto {
  @ApiPropertyOptional({ description: 'Approver comment', example: 'Approved based on strong collateral' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectOverrideDto {
  @ApiProperty({ description: 'Rejection reason', example: 'Insufficient justification for override' })
  @IsString()
  reason: string;
}

export class OverrideApprovalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  overrideDecisionId: string;

  @ApiProperty()
  status: OverrideApprovalStatus;

  @ApiProperty()
  requiresDualApproval: boolean;

  @ApiProperty()
  firstApproverId: string;

  @ApiPropertyOptional()
  secondApproverId?: string;

  @ApiPropertyOptional()
  firstApprovedAt?: Date;

  @ApiPropertyOptional()
  secondApprovedAt?: Date;

  @ApiPropertyOptional()
  rejectedAt?: Date;

  @ApiPropertyOptional()
  rejectionReason?: string;
}

