import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject, IsArray, IsBoolean } from 'class-validator';

export enum TestType {
  UNIT = 'UNIT',
  INTEGRATION = 'INTEGRATION',
  E2E = 'E2E',
  PERFORMANCE = 'PERFORMANCE',
  LOAD = 'LOAD',
  SECURITY = 'SECURITY',
}

export enum TestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export class CreateTestSuiteDto {
  @ApiProperty({ description: 'Test suite name', example: 'Loan API Tests' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Test type', enum: TestType })
  @IsEnum(TestType)
  testType: TestType;

  @ApiPropertyOptional({ description: 'Description', example: 'Tests for loan API endpoints' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Test cases', type: [Object] })
  @IsOptional()
  @IsArray()
  testCases?: Array<{
    name: string;
    endpoint: string;
    method: string;
    expectedStatus: number;
    assertions?: Record<string, any>;
  }>;
}

export class RunTestSuiteDto {
  @ApiPropertyOptional({ description: 'Test case IDs to run', type: [String] })
  @IsOptional()
  @IsArray()
  testCaseIds?: string[];

  @ApiPropertyOptional({ description: 'Environment', example: 'staging' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({ description: 'Parallel execution', example: false })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean;
}

export class TestResult {
  @ApiProperty({ description: 'Test result ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Test suite name' })
  testSuiteName: string;

  @ApiProperty({ description: 'Status', enum: TestStatus })
  status: TestStatus;

  @ApiProperty({ description: 'Total tests', example: 25 })
  totalTests: number;

  @ApiProperty({ description: 'Passed tests', example: 23 })
  passedTests: number;

  @ApiProperty({ description: 'Failed tests', example: 2 })
  failedTests: number;

  @ApiProperty({ description: 'Duration (ms)', example: 1250 })
  duration: number;

  @ApiProperty({ description: 'Created date', example: '2024-01-15T00:00:00Z' })
  createdAt: Date;
}

