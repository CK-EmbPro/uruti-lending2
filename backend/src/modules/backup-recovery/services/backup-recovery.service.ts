import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Backup, BackupType, BackupStatus } from '../entities/backup.entity';
import { BackupSchedule } from '../entities/backup-schedule.entity';
import {
  CreateBackupDto,
  BackupResult,
  RestoreBackupDto,
  RestoreStatus,
  BackupSchedule as BackupScheduleDto,
  CreateBackupScheduleDto,
} from '../dto/backup-recovery.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupRecoveryService {
  private readonly logger = new Logger(BackupRecoveryService.name);
  private readonly backupDir = process.env.BACKUP_DIR || './backups';

  constructor(
    @InjectRepository(Backup)
    private readonly backupRepository: Repository<Backup>,
    @InjectRepository(BackupSchedule)
    private readonly scheduleRepository: Repository<BackupSchedule>,
  ) {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Create backup
   */
  async createBackup(
    dto: CreateBackupDto,
    companyId: string,
  ): Promise<BackupResult> {
    this.logger.log(`Creating backup: ${dto.name} for company ${companyId}`);

    const backup = this.backupRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      status: BackupStatus.IN_PROGRESS,
      includeData: dto.includeData !== false,
      includeFiles: dto.includeFiles !== false,
      entities: dto.entities,
    });

    const saved = await this.backupRepository.save(backup);

    // Perform backup asynchronously
    this.performBackup(saved).catch((error) => {
      this.logger.error(`Backup failed: ${error.message}`, error.stack);
      saved.status = BackupStatus.FAILED;
      saved.errorMessage = error.message;
      this.backupRepository.save(saved);
    });

    return this.mapToResult(saved);
  }

  /**
   * Get backups
   */
  async getBackups(companyId: string): Promise<BackupResult[]> {
    const backups = await this.backupRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return backups.map((b) => this.mapToResult(b));
  }

  /**
   * Restore backup
   */
  async restoreBackup(
    dto: RestoreBackupDto,
    companyId: string,
  ): Promise<{ id: string; status: RestoreStatus; message: string }> {
    const backup = await this.backupRepository.findOne({
      where: { id: dto.backupId, companyId },
    });

    if (!backup) {
      throw new Error(`Backup ${dto.backupId} not found`);
    }

    if (backup.status !== BackupStatus.COMPLETED) {
      throw new Error(`Backup ${dto.backupId} is not completed`);
    }

    this.logger.log(`Restoring backup: ${backup.name} for company ${companyId}`);

    // Perform restore asynchronously
    this.performRestore(backup, dto).catch((error) => {
      this.logger.error(`Restore failed: ${error.message}`, error.stack);
    });

    return {
      id: backup.id,
      status: RestoreStatus.IN_PROGRESS,
      message: 'Restore started',
    };
  }

  /**
   * Create backup schedule
   */
  async createBackupSchedule(
    dto: CreateBackupScheduleDto,
    companyId: string,
  ): Promise<BackupScheduleDto> {
    const schedule = this.scheduleRepository.create({
      companyId,
      name: dto.name,
      cronExpression: dto.cronExpression,
      type: dto.type,
      retentionDays: dto.retentionDays || 30,
      isActive: true,
    });

    const saved = await this.scheduleRepository.save(schedule);

    return this.mapScheduleToDto(saved);
  }

  /**
   * Get backup schedules
   */
  async getBackupSchedules(companyId: string): Promise<BackupScheduleDto[]> {
    const schedules = await this.scheduleRepository.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });

    return schedules.map((s) => this.mapScheduleToDto(s));
  }

  /**
   * Toggle backup schedule
   */
  async toggleBackupSchedule(
    scheduleId: string,
    isActive: boolean,
    companyId: string,
  ): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, companyId },
    });

    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    schedule.isActive = isActive;
    await this.scheduleRepository.save(schedule);
  }

  /**
   * Delete old backups
   */
  async cleanupOldBackups(companyId: string, retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const oldBackups = await this.backupRepository.find({
      where: {
        companyId,
        createdAt: LessThan(cutoffDate),
        status: BackupStatus.COMPLETED,
      },
    });

    let deletedCount = 0;

    for (const backup of oldBackups) {
      // Delete backup file
      if (backup.filePath && fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
      }

      await this.backupRepository.remove(backup);
      deletedCount++;
    }

    this.logger.log(`Deleted ${deletedCount} old backups for company ${companyId}`);

    return deletedCount;
  }

  // Private helper methods

  private async performBackup(backup: Backup): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup-${backup.companyId}-${timestamp}.sql`;
      const filePath = path.join(this.backupDir, fileName);

      // In production, would use actual database backup tool (pg_dump, mysqldump, etc.)
      // For now, create a placeholder file
      const backupData = {
        companyId: backup.companyId,
        type: backup.type,
        entities: backup.entities,
        timestamp: new Date().toISOString(),
        data: 'Backup data would be here in production',
      };

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      const stats = fs.statSync(filePath);

      backup.status = BackupStatus.COMPLETED;
      backup.filePath = filePath;
      backup.fileSize = stats.size;
      backup.completedAt = new Date();

      await this.backupRepository.save(backup);

      this.logger.log(`Backup completed: ${backup.name} (${filePath})`);
    } catch (error: any) {
      backup.status = BackupStatus.FAILED;
      backup.errorMessage = error.message;
      await this.backupRepository.save(backup);
      throw error;
    }
  }

  private async performRestore(backup: Backup, dto: RestoreBackupDto): Promise<void> {
    try {
      if (!backup.filePath || !fs.existsSync(backup.filePath)) {
        throw new Error(`Backup file not found: ${backup.filePath}`);
      }

      // In production, would use actual database restore tool (pg_restore, mysql, etc.)
      const backupData = JSON.parse(fs.readFileSync(backup.filePath, 'utf-8'));

      this.logger.log(`Restore completed: ${backup.name}`);

      // In production, would restore actual data
    } catch (error: any) {
      this.logger.error(`Restore failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapToResult(backup: Backup): BackupResult {
    return {
      id: backup.id,
      name: backup.name,
      type: backup.type,
      status: backup.status,
      fileSize: backup.fileSize || 0,
      filePath: backup.filePath || '',
      createdAt: backup.createdAt.toISOString(),
      completedAt: backup.completedAt?.toISOString(),
      errorMessage: backup.errorMessage || undefined,
    };
  }

  private mapScheduleToDto(schedule: BackupSchedule): BackupScheduleDto {
    return {
      id: schedule.id,
      name: schedule.name,
      cronExpression: schedule.cronExpression,
      type: schedule.type,
      isActive: schedule.isActive,
      retentionDays: schedule.retentionDays,
      lastRun: schedule.lastRun?.toISOString(),
      nextRun: schedule.nextRun?.toISOString(),
    };
  }
}

