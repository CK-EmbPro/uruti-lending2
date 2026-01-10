import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BackupRecoveryService } from './services/backup-recovery.service';
import {
  CreateBackupDto,
  RestoreBackupDto,
  CreateBackupScheduleDto,
} from './dto/backup-recovery.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('backup-recovery')
@ApiBearerAuth('JWT-auth')
@Controller('backup-recovery')
@UseGuards(CompanyGuard)
export class BackupRecoveryController {
  constructor(private readonly backupService: BackupRecoveryService) {}

  @Post('backups')
  @ApiOperation({
    summary: 'Create backup',
    description: 'Creates a new backup (full, incremental, or differential). Supports selective entity backup and file inclusion.',
  })
  @ApiBody({ type: CreateBackupDto })
  @ApiResponse({
    status: 201,
    description: 'Backup created successfully',
  })
  async createBackup(
    @Body() dto: CreateBackupDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.backupService.createBackup(dto, companyId);
  }

  @Get('backups')
  @ApiOperation({
    summary: 'Get backups',
    description: 'Returns list of all backups for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Backups retrieved successfully',
  })
  async getBackups(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.backupService.getBackups(companyId);
  }

  @Post('backups/restore')
  @ApiOperation({
    summary: 'Restore backup',
    description: 'Restores data from a backup. Supports selective entity restore and file restoration.',
  })
  @ApiBody({ type: RestoreBackupDto })
  @ApiResponse({
    status: 200,
    description: 'Restore started successfully',
  })
  async restoreBackup(
    @Body() dto: RestoreBackupDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.backupService.restoreBackup(dto, companyId);
  }

  @Post('schedules')
  @ApiOperation({
    summary: 'Create backup schedule',
    description: 'Creates a scheduled backup using cron expression. Supports automatic retention and cleanup.',
  })
  @ApiBody({ type: CreateBackupScheduleDto })
  @ApiResponse({
    status: 201,
    description: 'Backup schedule created successfully',
  })
  async createBackupSchedule(
    @Body() dto: CreateBackupScheduleDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.backupService.createBackupSchedule(dto, companyId);
  }

  @Get('schedules')
  @ApiOperation({
    summary: 'Get backup schedules',
    description: 'Returns list of all backup schedules for the company.',
  })
  @ApiResponse({
    status: 200,
    description: 'Backup schedules retrieved successfully',
  })
  async getBackupSchedules(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.backupService.getBackupSchedules(companyId);
  }

  @Patch('schedules/:id/toggle')
  @ApiOperation({
    summary: 'Toggle backup schedule',
    description: 'Activates or deactivates a backup schedule.',
  })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Backup schedule status updated successfully',
  })
  async toggleBackupSchedule(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.backupService.toggleBackupSchedule(id, body.isActive, companyId);
    return { message: 'Backup schedule status updated successfully' };
  }

  @Delete('backups/cleanup')
  @ApiOperation({
    summary: 'Cleanup old backups',
    description: 'Deletes old backups based on retention policy.',
  })
  @ApiQuery({ name: 'retentionDays', required: false, description: 'Retention days', example: 30 })
  @ApiResponse({
    status: 200,
    description: 'Old backups cleaned up successfully',
  })
  async cleanupOldBackups(
    @Query('retentionDays') retentionDays: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const deletedCount = await this.backupService.cleanupOldBackups(
      companyId,
      retentionDays ? parseInt(retentionDays, 10) : 30,
    );
    return { message: `Deleted ${deletedCount} old backups` };
  }
}

