import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderChannel, ReminderStatus } from '../entities/payment-reminder.entity';

export class CreatePaymentReminderDto {
  @ApiProperty({ description: 'Loan ID', example: 'uuid-loan-1' })
  @IsString()
  loanId: string;

  @ApiProperty({ description: 'Due date', example: '2024-03-15' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Amount due', example: 485.66 })
  @IsNumber()
  amountDue: number;

  @ApiProperty({ description: 'Days before due date', example: 3 })
  @IsNumber()
  daysBeforeDue: number;

  @ApiPropertyOptional({ description: 'Reminder channel', enum: ReminderChannel })
  @IsEnum(ReminderChannel)
  @IsOptional()
  channel?: ReminderChannel;

  @ApiPropertyOptional({ description: 'Recipient email' })
  @IsEmail()
  @IsOptional()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Recipient phone' })
  @IsString()
  @IsOptional()
  recipientPhone?: string;
}

export class UpdatePaymentReminderDto {
  @ApiPropertyOptional({ description: 'Reminder status', enum: ReminderStatus })
  @IsEnum(ReminderStatus)
  @IsOptional()
  status?: ReminderStatus;

  @ApiPropertyOptional({ description: 'Failure reason' })
  @IsString()
  @IsOptional()
  failureReason?: string;
}

