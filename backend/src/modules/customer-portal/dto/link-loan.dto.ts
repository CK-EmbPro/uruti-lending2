import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkLoanDto {
  @ApiProperty({ description: 'Loan number to link', example: 'LOAN-2024-001' })
  @IsString()
  loanNumber: string;

  @ApiProperty({ description: 'Optional: Email address for verification', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Optional: Phone number for verification', required: false })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ description: 'Optional: Last 4 digits of SSN for verification', required: false })
  @IsOptional()
  @IsString()
  @MinLength(4)
  ssnLast4?: string;
}

