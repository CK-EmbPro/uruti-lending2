import { IsString, IsDateString, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { DisputeType } from '../../../common/enums/dispute-type.enum';

export class CreateDisputeDto {
  @IsString()
  loanId: string;

  @IsEnum(DisputeType)
  disputeType: DisputeType;

  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  disputedAmount?: number;

  @IsString()
  @IsOptional()
  disputedChargeId?: string;

  @IsString()
  @IsOptional()
  disputedChargeType?: string;

  @IsString()
  @IsOptional()
  borrowerStatement?: string;

  @IsString()
  @IsOptional()
  supportingDocuments?: string;

  @IsString()
  @IsOptional()
  reportedBy?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

