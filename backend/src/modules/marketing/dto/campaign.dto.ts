import { IsString, IsEnum, IsOptional, IsDateString, IsObject, IsInt, IsNumber, IsBoolean } from 'class-validator';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';
import { CampaignType } from '../../../common/enums/campaign-type.enum';
import { DistributionChannel } from '../../../common/enums/distribution-channel.enum';

export class CreateCampaignDto {
  @IsString()
  campaignName: string;

  @IsEnum(CampaignType)
  campaignType: CampaignType;

  @IsObject()
  targetCriteria: Record<string, any>;

  @IsEnum(DistributionChannel)
  distributionChannel: DistributionChannel;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsObject()
  offerDetails: Record<string, any>;

  @IsOptional()
  @IsString()
  offerMessage?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsObject()
  targetCriteria?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class LaunchCampaignDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryCampaignsDto {
  @IsOptional()
  @IsEnum(CampaignType)
  campaignType?: CampaignType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsString()
  createdBy?: string;
}














