import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsObject,
  Min,
  IsEnum,
} from 'class-validator';

export class PostExternalRepaymentDto {
  @ApiProperty({ description: 'External payment reference ID' })
  @IsString()
  externalReferenceId: string;

  @ApiProperty({ description: 'Loan number or external loan reference' })
  @IsString()
  loanReference: string; // Can be loanNumber or externalReferenceId

  @ApiProperty({ description: 'Repayment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Payment date', example: '2024-01-15' })
  @IsDateString()
  paymentDate: string;

  // Trip Financing Specific
  @ApiPropertyOptional({ description: 'Trip ID from UrutiX' })
  @IsString()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ description: 'Revenue transaction ID' })
  @IsString()
  @IsOptional()
  revenueTransactionId?: string;

  @ApiPropertyOptional({ description: 'Total trip revenue' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalTripRevenue?: number;

  @ApiPropertyOptional({ description: 'Repayment percentage of revenue' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  repaymentPercentage?: number;

  @ApiPropertyOptional({ description: 'Processing notes' })
  @IsString()
  @IsOptional()
  processingNotes?: string;

  @ApiPropertyOptional({ description: 'Additional external data' })
  @IsObject()
  @IsOptional()
  externalData?: Record<string, any>;
}

