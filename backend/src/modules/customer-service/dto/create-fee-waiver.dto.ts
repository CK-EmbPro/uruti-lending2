import { IsString, IsDateString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { WaiverType } from '../../../common/enums/waiver-type.enum';

export class CreateFeeWaiverDto {
  @IsString()
  loanId: string;

  @IsEnum(WaiverType)
  waiverType: WaiverType;

  @IsString()
  @IsOptional()
  feeType?: string;

  @IsNumber()
  @Min(0)
  feeAmount: number;

  @IsString()
  @IsOptional()
  feeReferenceId?: string;

  @IsString()
  @IsOptional()
  requestReason?: string;

  @IsString()
  @IsOptional()
  requestedBy?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

