import { IsString, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoanSecurityPriceDto {
  @ApiProperty({ description: 'Loan Security ID', example: 'security-uuid' })
  @IsString()
  loanSecurityId: string;

  @ApiProperty({ description: 'Security price', example: 1000, minimum: 0 })
  @IsNumber()
  @Min(0)
  loanSecurityPrice: number;

  @ApiProperty({ description: 'Valid from (ISO 8601)', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid upto (ISO 8601)', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  validUpto: string;
}

