import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, RootType } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ description: 'Account code (unique per company)', example: 'ACC-001' })
  @IsString()
  @MaxLength(50)
  accountCode: string;

  @ApiProperty({ description: 'Account name', example: 'Loan Account' })
  @IsString()
  @MaxLength(200)
  accountName: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.ASSET,
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({
    description: 'Root type for reporting',
    enum: RootType,
    example: RootType.ASSET,
  })
  @IsEnum(RootType)
  rootType: RootType;

  @ApiProperty({ description: 'Company ID', example: 'company-uuid' })
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional({ description: 'Parent account ID (for hierarchy)', example: 'parent-uuid' })
  @IsUUID()
  @IsOptional()
  parentAccountId?: string;

  @ApiPropertyOptional({ description: 'Is this a group account?', default: false })
  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;

  @ApiPropertyOptional({ description: 'Opening balance', default: 0, minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  openingBalance?: number;

  @ApiPropertyOptional({ description: 'Account description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Bank account number (if applicable)' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'Bank name (if applicable)' })
  @IsString()
  @IsOptional()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Account currency', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class UpdateAccountDto {
  @ApiPropertyOptional({ description: 'Account name' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is frozen', default: false })
  @IsBoolean()
  @IsOptional()
  isFrozen?: boolean;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class QueryAccountsDto {
  @ApiPropertyOptional({ description: 'Company ID' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Account type', enum: AccountType })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @ApiPropertyOptional({ description: 'Root type', enum: RootType })
  @IsEnum(RootType)
  @IsOptional()
  rootType?: RootType;

  @ApiPropertyOptional({ description: 'Is group account?' })
  @IsBoolean()
  @IsOptional()
  isGroup?: boolean;

  @ApiPropertyOptional({ description: 'Is active?', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Parent account ID' })
  @IsUUID()
  @IsOptional()
  parentAccountId?: string;
}

