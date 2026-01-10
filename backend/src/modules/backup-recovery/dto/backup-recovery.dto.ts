import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';

export enum BackupType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
  DIFFERENTIAL = 'DIFFERENTIAL',
}

export enum BackupStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum RestoreStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreateBackupDto {
  @ApiProperty({ description: 'Backup name', example: 'Daily Backup 2024-01-15' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Backup type', enum: BackupType, default: BackupType.FULL })
  @IsEnum(BackupType)
  type: BackupType;

  @ApiPropertyOptional({ description: 'Include data', default: true })
  @IsOptional()
  @IsBoolean()
  includeData?: boolean;

  @ApiPropertyOptional({ description: 'Include files', default: true })
  @IsOptional()
  @IsBoolean()
  includeFiles?: boolean;

  @ApiPropertyOptional({ description: 'Entities to backup', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entities?: string[];
}

export class BackupResult {
  @ApiProperty({ description: 'Backup ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Backup name', example: 'Daily Backup 2024-01-15' })
  name: string;

  @ApiProperty({ description: 'Backup type', enum: BackupType })
  type: BackupType;

  @ApiProperty({ description: 'Status', enum: BackupStatus })
  status: BackupStatus;

  @ApiProperty({ description: 'File size (bytes)', example: 1048576 })
  fileSize: number;

  @ApiProperty({ description: 'File path', example: '/backups/backup-2024-01-15.sql' })
  filePath: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Completed at', example: '2024-01-15T10:35:00Z' })
  completedAt?: string;

  @ApiProperty({ description: 'Error message', example: null })
  errorMessage?: string;
}

export class RestoreBackupDto {
  @ApiProperty({ description: 'Backup ID', example: 'uuid' })
  @IsString()
  backupId: string;

  @ApiPropertyOptional({ description: 'Restore data', default: true })
  @IsOptional()
  @IsBoolean()
  restoreData?: boolean;

  @ApiPropertyOptional({ description: 'Restore files', default: true })
  @IsOptional()
  @IsBoolean()
  restoreFiles?: boolean;

  @ApiPropertyOptional({ description: 'Entities to restore', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entities?: string[];
}

export class RestoreResult {
  @ApiProperty({ description: 'Restore ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Backup ID', example: 'uuid' })
  backupId: string;

  @ApiProperty({ description: 'Status', enum: RestoreStatus })
  status: RestoreStatus;

  @ApiProperty({ description: 'Started at', example: '2024-01-15T10:30:00Z' })
  startedAt: string;

  @ApiProperty({ description: 'Completed at', example: '2024-01-15T10:35:00Z' })
  completedAt?: string;

  @ApiProperty({ description: 'Error message', example: null })
  errorMessage?: string;
}

export class BackupSchedule {
  @ApiProperty({ description: 'Schedule ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Schedule name', example: 'Daily Backup' })
  name: string;

  @ApiProperty({ description: 'Cron expression', example: '0 2 * * *' })
  cronExpression: string;

  @ApiProperty({ description: 'Backup type', enum: BackupType })
  type: BackupType;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Retention days', example: 30 })
  retentionDays: number;

  @ApiProperty({ description: 'Last run', example: '2024-01-15T02:00:00Z' })
  lastRun?: string;

  @ApiProperty({ description: 'Next run', example: '2024-01-16T02:00:00Z' })
  nextRun?: string;
}

export class CreateBackupScheduleDto {
  @ApiProperty({ description: 'Schedule name', example: 'Daily Backup' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Cron expression', example: '0 2 * * *' })
  @IsString()
  cronExpression: string;

  @ApiProperty({ description: 'Backup type', enum: BackupType })
  @IsEnum(BackupType)
  type: BackupType;

  @ApiPropertyOptional({ description: 'Retention days', example: 30 })
  @IsOptional()
  retentionDays?: number;
}

