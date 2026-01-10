import { IsString, IsDateString, IsOptional, IsBoolean, IsInt, IsEnum } from 'class-validator';
import { CollectionActivityType } from '../../../common/enums/collection-activity-type.enum';
import { CollectionChannel } from '../../../common/enums/collection-channel.enum';

export class CreateCollectionActivityDto {
  @IsString()
  loanId: string;

  @IsEnum(CollectionActivityType)
  activityType: CollectionActivityType;

  @IsEnum(CollectionChannel)
  channel: CollectionChannel;

  @IsDateString()
  activityDate: string;

  @IsString()
  @IsOptional()
  activityTime?: string;

  @IsString()
  @IsOptional()
  conversationNotes?: string;

  @IsBoolean()
  @IsOptional()
  rightPartyContact?: boolean;

  @IsBoolean()
  @IsOptional()
  ceaseAndDesist?: boolean;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsString()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  contactAddress?: string;

  @IsInt()
  @IsOptional()
  callDuration?: number;

  @IsBoolean()
  @IsOptional()
  callbackRequested?: boolean;

  @IsDateString()
  @IsOptional()
  callbackDate?: string;

  @IsString()
  @IsOptional()
  outcome?: string;

  @IsString()
  @IsOptional()
  remarks?: string;
}

