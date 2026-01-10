import { IsString, IsEnum, IsOptional, IsDateString, IsNumber, IsObject, IsBoolean, IsInt } from 'class-validator';
import { OfferStatus } from '../../../common/enums/offer-status.enum';
import { DistributionChannel } from '../../../common/enums/distribution-channel.enum';

export class GenerateOffersDto {
  @IsString()
  campaignId: string;

  @IsOptional()
  @IsInt()
  limit?: number; // Limit number of offers to generate
}

export class SendOfferDto {
  @IsString()
  offerId: string;

  @IsOptional()
  @IsEnum(DistributionChannel)
  channel?: DistributionChannel;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class TrackOfferResponseDto {
  @IsString()
  offerId: string;

  @IsString()
  responseType: string; // 'viewed', 'clicked', 'accepted', 'declined'

  @IsOptional()
  @IsObject()
  responseData?: Record<string, any>;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class AcceptOfferDto {
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class DeclineOfferDto {
  @IsOptional()
  @IsString()
  declineReason?: string;
}

export class QueryOffersDto {
  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;

  @IsOptional()
  @IsBoolean()
  converted?: boolean;
}

