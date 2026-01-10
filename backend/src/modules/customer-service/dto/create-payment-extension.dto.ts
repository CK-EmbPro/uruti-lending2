import { IsString, IsNumber, IsDateString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { ExtensionType } from '../../../common/enums/extension-type.enum';

export class CreatePaymentExtensionDto {
  @IsString()
  loanId: string;

  @IsDateString()
  originalDueDate: string;

  @IsInt()
  @Min(1)
  extensionDays: number;

  @IsEnum(ExtensionType)
  extensionType: ExtensionType;

  @IsString()
  @IsOptional()
  requestReason?: string;

  @IsString()
  @IsOptional()
  hardshipDetails?: string;

  @IsString()
  @IsOptional()
  requestedBy?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

