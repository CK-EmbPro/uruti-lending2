import { IsString, IsDateString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { AccountUpdateType } from '../../../common/enums/account-update-type.enum';

export class CreateAccountUpdateDto {
  @IsString()
  loanId: string;

  @IsEnum(AccountUpdateType)
  updateType: AccountUpdateType;

  @IsString()
  @IsOptional()
  newAddress?: string;

  @IsString()
  @IsOptional()
  newCity?: string;

  @IsString()
  @IsOptional()
  newState?: string;

  @IsString()
  @IsOptional()
  newZipCode?: string;

  @IsString()
  @IsOptional()
  newCountry?: string;

  @IsString()
  @IsOptional()
  newPhone?: string;

  @IsString()
  @IsOptional()
  newEmail?: string;

  @IsBoolean()
  @IsOptional()
  temporary?: boolean;

  @IsDateString()
  @IsOptional()
  temporaryUntil?: string;

  @IsString()
  @IsOptional()
  requestedBy?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

