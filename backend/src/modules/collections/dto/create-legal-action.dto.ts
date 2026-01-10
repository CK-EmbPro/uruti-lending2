import { IsString, IsDateString, IsOptional, IsBoolean, IsNumber, IsInt, IsEnum } from 'class-validator';
import { LegalActionType } from '../../../common/enums/legal-action-type.enum';

export class CreateLegalActionDto {
  @IsString()
  loanId: string;

  @IsEnum(LegalActionType)
  actionType: LegalActionType;

  @IsString()
  @IsOptional()
  attorneyName?: string;

  @IsString()
  @IsOptional()
  attorneyFirm?: string;

  @IsString()
  @IsOptional()
  attorneyContact?: string;

  @IsNumber()
  claimAmount: number;

  @IsNumber()
  @IsOptional()
  legalFees?: number;

  @IsNumber()
  @IsOptional()
  courtCosts?: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

