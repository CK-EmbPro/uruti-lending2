import { IsString, IsOptional, IsEnum, IsObject, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RuleStatus } from '../../../common/enums/rule-status.enum';

export class CreateBusinessRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'Credit Score Threshold Rule' })
  @IsString()
  ruleName: string;

  @ApiProperty({ description: 'Rule category', example: 'Credit Decisioning' })
  @IsString()
  ruleCategory: string;

  @ApiProperty({ description: 'Rule description' })
  @IsString()
  ruleDescription: string;

  @ApiProperty({ description: 'Rule definition (JSON)', type: Object })
  @IsObject()
  ruleDefinition: Record<string, any>;

  @ApiPropertyOptional({ description: 'Test data', type: Object })
  @IsObject()
  @IsOptional()
  testData?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Version', example: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;
}

export class UpdateBusinessRuleDto {
  @ApiPropertyOptional({ description: 'Rule name' })
  @IsString()
  @IsOptional()
  ruleName?: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsString()
  @IsOptional()
  ruleDescription?: string;

  @ApiPropertyOptional({ description: 'Rule definition', type: Object })
  @IsObject()
  @IsOptional()
  ruleDefinition?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Rule status', enum: RuleStatus })
  @IsEnum(RuleStatus)
  @IsOptional()
  status?: RuleStatus;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class TestBusinessRuleDto {
  @ApiPropertyOptional({ description: 'Test scenarios', type: Object })
  @IsObject()
  @IsOptional()
  testScenarios?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Test remarks' })
  @IsString()
  @IsOptional()
  testRemarks?: string;
}

export class PromoteBusinessRuleDto {
  @ApiPropertyOptional({ description: 'Promotion notes' })
  @IsString()
  @IsOptional()
  promotionNotes?: string;

  @ApiPropertyOptional({ description: 'Gradual rollout percentage (0-100)', example: 50 })
  @IsNumber()
  @IsOptional()
  rolloutPercentage?: number;
}

export class AnalyzeBusinessRuleImpactDto {
  @ApiPropertyOptional({ description: 'Analysis parameters', type: Object })
  @IsObject()
  @IsOptional()
  analysisParams?: Record<string, any>;
}

