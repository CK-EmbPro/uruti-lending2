import { IsString, IsEnum, IsOptional, IsDateString, IsObject, IsNumber, IsInt } from 'class-validator';
import { OpportunityStatus } from '../../../common/enums/opportunity-status.enum';

export class IdentifyOpportunitiesDto {
  @IsOptional()
  @IsString()
  customerId?: string; // If provided, analyze specific customer

  @IsOptional()
  @IsInt()
  limit?: number; // Limit number of opportunities to identify
}

export class AssignOpportunityDto {
  @IsString()
  assignedTo: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class ContactCustomerDto {
  @IsString()
  contactMethod: string; // 'phone', 'email', 'in-person', etc.

  @IsOptional()
  @IsString()
  contactNotes?: string;
}

export class PresentOfferDto {
  @IsObject()
  offerDetails: Record<string, any>;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateOpportunityStatusDto {
  @IsEnum(OpportunityStatus)
  status: OpportunityStatus;

  @IsOptional()
  @IsString()
  declineReason?: string;

  @IsOptional()
  @IsString()
  convertedApplicationId?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryOpportunitiesDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  opportunityType?: string;
}














