import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DataMigrationService } from './services/data-migration.service';
import { CreateMigrationDto, MigrationStatus } from './dto/data-migration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Data Migration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('data-migration')
export class DataMigrationController {
  constructor(private readonly migrationService: DataMigrationService) {}

  @Post('migrations')
  @ApiOperation({ summary: 'Create migration' })
  @ApiResponse({ status: 201, description: 'Migration created successfully' })
  createMigration(@Body() createDto: CreateMigrationDto) {
    return this.migrationService.createMigration(createDto);
  }

  @Get('migrations')
  @ApiOperation({ summary: 'Get all migrations' })
  @ApiResponse({ status: 200, description: 'List of migrations' })
  findAllMigrations(@Query('status') status?: MigrationStatus) {
    return this.migrationService.findAllMigrations(status);
  }

  @Get('migrations/:id')
  @ApiOperation({ summary: 'Get migration by ID' })
  @ApiResponse({ status: 200, description: 'Migration details' })
  findOneMigration(@Param('id') id: string) {
    return this.migrationService.findOneMigration(id);
  }

  @Post('migrations/:id/start')
  @ApiOperation({ summary: 'Start migration' })
  @ApiResponse({ status: 200, description: 'Migration started' })
  startMigration(@Param('id') id: string) {
    return this.migrationService.startMigration(id);
  }

  @Get('migrations/:id/progress')
  @ApiOperation({ summary: 'Get migration progress' })
  @ApiResponse({ status: 200, description: 'Migration progress' })
  getMigrationProgress(@Param('id') id: string) {
    return this.migrationService.getMigrationProgress(id);
  }

  @Post('migrations/:id/rollback')
  @ApiOperation({ summary: 'Rollback migration' })
  @ApiResponse({ status: 200, description: 'Migration rolled back' })
  rollbackMigration(@Param('id') id: string) {
    return this.migrationService.rollbackMigration(id);
  }
}

