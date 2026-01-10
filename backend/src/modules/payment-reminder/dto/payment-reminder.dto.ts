import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, Min, Max } from 'class-validator';

export enum ReminderType {
  UPCOMING = 'UPCOMING',
  DUE_TODAY = 'DUE_TODAY',
  OVERDUE = 'OVERDUE',
  FINAL_NOTICE = 'FINAL_NOTICE',
}

export enum ReminderChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export class CreatePaymentReminderDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Reminder type', enum: ReminderType })
  @IsEnum(ReminderType)
  reminderType: ReminderType;

  @ApiProperty({ description: 'Days before/after due date', example: 3 })
  @IsNumber()
  @Min(-30)
  @Max(30)
  daysOffset: number; // Negative for before, positive for after

  @ApiProperty({ description: 'Reminder channels', enum: ReminderChannel, isArray: true })
  @IsEnum(ReminderChannel, { each: true })
  channels: ReminderChannel[];

  @ApiPropertyOptional({ description: 'Custom message', example: 'Your payment is due in 3 days' })
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SendPaymentReminderDto {
  @ApiProperty({ description: 'Loan repayment schedule ID', example: 'uuid' })
  @IsString()
  repaymentScheduleId: string;

  @ApiProperty({ description: 'Reminder channels', enum: ReminderChannel, isArray: true })
  @IsEnum(ReminderChannel, { each: true })
  channels: ReminderChannel[];

  @ApiPropertyOptional({ description: 'Custom message' })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

