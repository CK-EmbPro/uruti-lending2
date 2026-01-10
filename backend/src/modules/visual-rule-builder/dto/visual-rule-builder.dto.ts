import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum RuleType {
  CREDIT_DECISION = 'CREDIT_DECISION',
  PRICING = 'PRICING',
  COLLECTIONS = 'COLLECTIONS',
  APPROVAL = 'APPROVAL',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  ELIGIBILITY = 'ELIGIBILITY',
}

export enum RuleStatus {
  DRAFT = 'DRAFT',
  TESTING = 'TESTING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ConditionOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  BETWEEN = 'BETWEEN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
}

export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export class RuleCondition {
  @ApiProperty({ description: 'Field name', example: 'creditScore' })
  @IsString()
  field: string;

  @ApiProperty({ description: 'Operator', enum: ConditionOperator })
  @IsEnum(ConditionOperator)
  operator: ConditionOperator;

  @ApiProperty({ description: 'Value' })
  value: any;

  @ApiPropertyOptional({ description: 'Second value (for BETWEEN)', example: 100 })
  @IsOptional()
  secondValue?: any;
}

export class RuleAction {
  @ApiProperty({ description: 'Action type', example: 'APPROVE' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Action parameters', type: Object })
  @IsObject()
  parameters: Record<string, any>;
}

export class RuleNode {
  @ApiProperty({ description: 'Node ID', example: 'node-1' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Node type', example: 'CONDITION', enum: ['CONDITION', 'ACTION', 'LOGIC'] })
  @IsString()
  nodeType: string;

  @ApiPropertyOptional({ description: 'Condition', type: RuleCondition })
  @IsOptional()
  @ValidateNested()
  @Type(() => RuleCondition)
  condition?: RuleCondition;

  @ApiPropertyOptional({ description: 'Action', type: RuleAction })
  @IsOptional()
  @ValidateNested()
  @Type(() => RuleAction)
  action?: RuleAction;

  @ApiPropertyOptional({ description: 'Logical operator', enum: LogicalOperator })
  @IsOptional()
  @IsEnum(LogicalOperator)
  logicalOperator?: LogicalOperator;

  @ApiPropertyOptional({ description: 'Child nodes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  children?: string[];
}

export class CreateRuleDto {
  @ApiProperty({ description: 'Rule name', example: 'High Credit Score Approval' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Rule type', enum: RuleType })
  @IsEnum(RuleType)
  type: RuleType;

  @ApiProperty({ description: 'Rule description', example: 'Auto-approve applications with credit score >= 750' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Rule definition (visual nodes)', type: [RuleNode] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleNode)
  nodes: RuleNode[];

  @ApiPropertyOptional({ description: 'Priority', example: 1 })
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Is active', default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class RuleExecutionResult {
  @ApiProperty({ description: 'Execution ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Rule ID', example: 'uuid' })
  ruleId: string;

  @ApiProperty({ description: 'Input data', type: Object })
  inputData: Record<string, any>;

  @ApiProperty({ description: 'Execution result', type: Object })
  result: {
    matched: boolean;
    actions: Array<{ type: string; parameters: Record<string, any> }>;
    executionPath: string[];
  };

  @ApiProperty({ description: 'Execution time (ms)', example: 15 })
  executionTimeMs: number;

  @ApiProperty({ description: 'Executed at', example: '2024-01-15T10:30:00Z' })
  executedAt: string;
}

export class TestRuleDto {
  @ApiProperty({ description: 'Rule ID', example: 'uuid' })
  @IsString()
  ruleId: string;

  @ApiProperty({ description: 'Test data', type: Object })
  @IsObject()
  testData: Record<string, any>;
}

export class RuleImpactAnalysis {
  @ApiProperty({ description: 'Estimated affected loans', example: 150 })
  affectedLoans: number;

  @ApiProperty({ description: 'Estimated approval rate change', example: 5.2 })
  approvalRateChange: number;

  @ApiProperty({ description: 'Estimated revenue impact', example: 50000 })
  revenueImpact: number;

  @ApiProperty({ description: 'Risk impact', example: 'LOW', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  riskImpact: string;

  @ApiProperty({ description: 'Analysis details', type: Object })
  details: Record<string, any>;
}

