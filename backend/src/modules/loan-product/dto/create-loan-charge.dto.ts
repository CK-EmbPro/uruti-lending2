import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargeBasedOn } from '../entities/loan-charge.entity';

export class CreateLoanChargeDto {
  @ApiProperty({
    description: 'Charge type/code (item reference)',
    example: 'PROCESSING-FEE',
  })
  @IsString()
  chargeType: string;

  @ApiProperty({
    description: 'Charge calculation basis',
    enum: ChargeBasedOn,
    example: ChargeBasedOn.FIXED_AMOUNT,
  })
  @IsEnum(ChargeBasedOn)
  chargeBasedOn: ChargeBasedOn;

  @ApiPropertyOptional({
    description: 'Percentage (if chargeBasedOn is Percentage)',
    example: 2.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  percentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed amount (if chargeBasedOn is Fixed Amount)',
    example: 1000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Income account for the charge',
    example: 'ACC-001',
  })
  @IsString()
  @IsOptional()
  incomeAccount?: string;

  @ApiPropertyOptional({
    description: 'Receivable account',
    example: 'ACC-002',
  })
  @IsString()
  @IsOptional()
  receivableAccount?: string;

  @ApiPropertyOptional({
    description: 'Waiver account',
    example: 'ACC-003',
  })
  @IsString()
  @IsOptional()
  waiverAccount?: string;

  @ApiPropertyOptional({
    description: 'Write-off account',
    example: 'ACC-004',
  })
  @IsString()
  @IsOptional()
  writeOffAccount?: string;

  @ApiPropertyOptional({
    description: 'Suspense account',
    example: 'ACC-005',
  })
  @IsString()
  @IsOptional()
  suspenseAccount?: string;
}

