import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLoanSecurityDto {
  @ApiProperty({ description: 'Loan ID', example: 'loan-uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Security type', example: 'Property' })
  @IsString()
  securityType: string;

  @ApiPropertyOptional({ description: 'Security description', example: 'Residential property at 123 Main St' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Security value', example: 200000, minimum: 0 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Pledged date (ISO 8601)', example: '2024-01-01' })
  @IsDateString()
  pledgedDate: string;

  @ApiPropertyOptional({ description: 'Document references (JSON array)', example: '["doc1.pdf", "doc2.pdf"]' })
  @IsString()
  @IsOptional()
  documents?: string;
}

