import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean } from 'class-validator';

export enum MigrationType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
}

export enum MigrationStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export class CreateMigrationDto {
  @ApiProperty({ description: 'Migration name', example: 'Loan Data Migration' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Source system', example: 'legacy-system' })
  @IsString()
  sourceSystem: string;

  @ApiProperty({ description: 'Target entity', example: 'Loan' })
  @IsString()
  targetEntity: string;

  @ApiProperty({ description: 'Migration type', enum: MigrationType })
  @IsEnum(MigrationType)
  migrationType: MigrationType;

  @ApiPropertyOptional({ description: 'Field mapping', type: Object })
  @IsOptional()
  @IsObject()
  fieldMapping?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Data transformation rules', type: Object })
  @IsOptional()
  @IsObject()
  transformationRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Validation rules', type: Object })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;
}

export class MigrationProgress {
  @ApiProperty({ description: 'Total records', example: 10000 })
  totalRecords: number;

  @ApiProperty({ description: 'Processed records', example: 7500 })
  processedRecords: number;

  @ApiProperty({ description: 'Successful records', example: 7200 })
  successfulRecords: number;

  @ApiProperty({ description: 'Failed records', example: 300 })
  failedRecords: number;

  @ApiProperty({ description: 'Progress percentage', example: 75 })
  progressPercentage: number;

  @ApiProperty({ description: 'Estimated time remaining (seconds)', example: 120 })
  estimatedTimeRemaining: number;
}

