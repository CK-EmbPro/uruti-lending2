import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsObject } from 'class-validator';

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  TEXTAREA = 'TEXTAREA',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  CURRENCY = 'CURRENCY',
}

export enum EntityType {
  CUSTOMER = 'CUSTOMER',
  LOAN = 'LOAN',
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  DOCUMENT = 'DOCUMENT',
}

export class CreateCustomFieldDto {
  @ApiProperty({ description: 'Field name', example: 'Preferred Contact Method' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Field key (unique identifier)', example: 'preferred_contact_method' })
  @IsString()
  fieldKey: string;

  @ApiProperty({ description: 'Entity type', enum: EntityType })
  @IsEnum(EntityType)
  entityType: EntityType;

  @ApiProperty({ description: 'Field type', enum: FieldType })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiPropertyOptional({ description: 'Field label', example: 'Preferred Contact Method' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ description: 'Field description', example: 'Customer preferred method of contact' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Is required', default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Default value' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ description: 'Options (for SELECT/MULTI_SELECT)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Validation rules', type: Object })
  @IsOptional()
  @IsObject()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CustomField {
  @ApiProperty({ description: 'Field ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Field name', example: 'Preferred Contact Method' })
  name: string;

  @ApiProperty({ description: 'Field key', example: 'preferred_contact_method' })
  fieldKey: string;

  @ApiProperty({ description: 'Entity type', enum: EntityType })
  entityType: EntityType;

  @ApiProperty({ description: 'Field type', enum: FieldType })
  fieldType: FieldType;

  @ApiProperty({ description: 'Field label', example: 'Preferred Contact Method' })
  label: string;

  @ApiProperty({ description: 'Is required', example: false })
  isRequired: boolean;

  @ApiProperty({ description: 'Default value' })
  defaultValue: any;

  @ApiProperty({ description: 'Options', type: [String] })
  options: string[];

  @ApiProperty({ description: 'Display order', example: 1 })
  displayOrder: number;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;
}

export class SetCustomFieldValueDto {
  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  @IsString()
  entityId: string;

  @ApiProperty({ description: 'Field key', example: 'preferred_contact_method' })
  @IsString()
  fieldKey: string;

  @ApiProperty({ description: 'Field value' })
  value: any;
}

export class GetCustomFieldValuesDto {
  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ description: 'Entity type', enum: EntityType })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;
}

export class CustomFieldValue {
  @ApiProperty({ description: 'Value ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Entity ID', example: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Field key', example: 'preferred_contact_method' })
  fieldKey: string;

  @ApiProperty({ description: 'Field value' })
  value: any;

  @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
  updatedAt: string;
}

