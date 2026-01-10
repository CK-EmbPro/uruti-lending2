import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupRecoveryService } from './services/backup-recovery.service';
import { BackupRecoveryController } from './backup-recovery.controller';
import { Backup } from './entities/backup.entity';
import { BackupSchedule } from './entities/backup-schedule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Backup, BackupSchedule])],
  controllers: [BackupRecoveryController],
  providers: [BackupRecoveryService],
  exports: [BackupRecoveryService],
})
export class BackupRecoveryModule {}

