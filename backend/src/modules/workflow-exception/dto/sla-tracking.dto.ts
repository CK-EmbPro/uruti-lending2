import { IsString, IsEnum, IsOptional, IsDateString, IsInt, IsBoolean } from 'class-validator';
import { SLAStatus } from '../../../common/enums/sla-status.enum';

export class CreateSLATrackingDto {
  @IsString()
  taskId: string;

  @IsInt()
  slaHours: number;

  @IsOptional()
  @IsDateString()
  slaStartDate?: string;

  @IsOptional()
  @IsInt()
  alertBeforeHours?: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateSLATrackingDto {
  @IsOptional()
  @IsEnum(SLAStatus)
  status?: SLAStatus;

  @IsOptional()
  @IsString()
  escalatedTo?: string;

  @IsOptional()
  @IsString()
  escalationReason?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class EscalateSLADto {
  @IsString()
  escalatedTo: string;

  @IsString()
  escalationReason: string;
}

export class QuerySLATrackingsDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsEnum(SLAStatus)
  status?: SLAStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;

  @IsOptional()
  @IsBoolean()
  breached?: boolean;

  @IsOptional()
  @IsBoolean()
  alertSent?: boolean;
}

