import { IsString, IsDateString, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateThirdPartyPlacementDto {
  @IsString()
  loanId: string;

  @IsString()
  agencyId: string;

  @IsString()
  @IsOptional()
  placementReason?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

