import { IsString, IsDateString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateSkipTraceDto {
  @IsString()
  loanId: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  searchMethod?: string;

  @IsString()
  @IsOptional()
  thirdPartyService?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

