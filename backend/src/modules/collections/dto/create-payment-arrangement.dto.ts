import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CreatePaymentArrangementDto {
  @IsString()
  loanId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsInt()
  @Min(1)
  numberOfPayments: number;

  @IsNumber()
  @Min(0)
  paymentAmount: number;

  @IsString()
  paymentFrequency: string;

  @IsInt()
  @IsOptional()
  paymentDay?: number;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsString()
  @IsOptional()
  conditions?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

