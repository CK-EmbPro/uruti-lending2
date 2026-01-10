import { IsString, IsDateString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class ResolveDisputeDto {
  @IsString()
  resolutionType: string; // Resolved in Favor of Borrower, Resolved in Favor of Lender, Partial Resolution

  @IsString()
  resolutionDetails: string;

  @IsNumber()
  @IsOptional()
  adjustmentAmount?: number;

  @IsBoolean()
  @IsOptional()
  accountUpdated?: boolean;

  @IsString()
  @IsOptional()
  notificationMethod?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

