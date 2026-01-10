import { IsDateString, IsOptional, IsString, IsEnum, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StressTestType } from '../entities/stress-test.entity';

export class CreateStressTestDto {
  @ApiProperty({ description: 'Test name' })
  @IsString()
  testName: string;

  @ApiProperty({
    description: 'Test type',
    enum: StressTestType,
    example: StressTestType.CUSTOM,
  })
  @IsEnum(StressTestType)
  testType: StressTestType;

  @ApiProperty({ description: 'Test date (ISO 8601)', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  testDate?: string;

  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Scenario parameters',
    example: { defaultRate: 0.05, lossRate: 0.03, interestRateShock: 0.02 },
  })
  @IsObject()
  @IsOptional()
  scenarioParameters?: any;
}

export class RunStressTestDto {
  @ApiPropertyOptional({ description: 'Apply to specific loan product' })
  @IsString()
  @IsOptional()
  loanProductId?: string;

  @ApiPropertyOptional({ description: 'Include sensitivity analysis', default: false })
  @IsOptional()
  includeSensitivityAnalysis?: boolean;
}

