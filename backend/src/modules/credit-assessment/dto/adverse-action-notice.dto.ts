import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NoticeStatus } from '../entities/adverse-action-notice.entity';

export class CreateAdverseActionNoticeDto {
  @ApiProperty({ description: 'Loan application ID', example: 'uuid-application-1' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Credit score used', example: 650, minimum: 300, maximum: 850 })
  @IsNumber()
  @Min(300)
  @Max(850)
  @IsOptional()
  creditScore?: number;

  @ApiProperty({ description: 'Adverse factors', example: ['Low credit score', 'High debt-to-income ratio'] })
  @IsArray()
  adverseFactors: string[];

  @ApiProperty({ description: 'Primary reason for decline', example: 'Credit score below minimum threshold' })
  @IsString()
  reasonForDecline: string;

  @ApiPropertyOptional({ description: 'Credit bureau information', example: { bureau: 'Equifax', score: 650 } })
  @IsObject()
  @IsOptional()
  creditBureauInfo?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Counteroffer', example: 'Approved for $30,000 at 8.5% interest' })
  @IsString()
  @IsOptional()
  counteroffer?: string;

  @ApiPropertyOptional({ description: 'Reconsideration instructions', example: 'Submit updated income documentation' })
  @IsString()
  @IsOptional()
  reconsiderationInstructions?: string;
}

export class UpdateAdverseActionNoticeDto {
  @ApiPropertyOptional({ description: 'Notice status', enum: NoticeStatus })
  @IsEnum(NoticeStatus)
  @IsOptional()
  status?: NoticeStatus;

  @ApiPropertyOptional({ description: 'Delivery method', example: 'Email' })
  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @ApiPropertyOptional({ description: 'Compliance logged', default: false })
  @IsBoolean()
  @IsOptional()
  complianceLogged?: boolean;
}

