import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePayoffQuoteDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiPropertyOptional({ description: 'Payoff date (defaults to today)', example: '2024-03-15' })
  @IsDateString()
  @IsOptional()
  payoffDate?: string;

  @ApiPropertyOptional({ description: 'Valid until date (defaults to 30 days)', example: '2024-04-15' })
  @IsDateString()
  @IsOptional()
  validUntil?: string;
}

export class ProcessPayoffDto {
  @ApiProperty({ description: 'Payoff quote ID', example: 'uuid-quote-1' })
  @IsString()
  quoteId: string;

  @ApiProperty({ description: 'Payment amount', example: 48500.00 })
  @IsNumber()
  paymentAmount: number;

  @ApiPropertyOptional({ description: 'Payment date', example: '2024-03-15' })
  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Mode of payment', example: 'Wire Transfer' })
  @IsString()
  @IsOptional()
  modeOfPayment?: string;
}














