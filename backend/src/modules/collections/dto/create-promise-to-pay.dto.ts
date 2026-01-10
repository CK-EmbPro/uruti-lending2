import { IsString, IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreatePromiseToPayDto {
  @IsString()
  loanId: string;

  @IsDateString()
  promiseDate: string;

  @IsNumber()
  promisedAmount: number;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsOptional()
  promisedBy?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

