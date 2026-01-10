import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UptimeMonitoringService } from './services/uptime-monitoring.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly uptimeMonitoringService: UptimeMonitoringService,
  ) {}

  @Get()
  async check() {
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');
      
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('database')
  async checkDatabase() {
    try {
      // Test database connection
      await this.dataSource.query('SELECT 1');
      
      // Check if users table exists
      const usersTableExistsResult = await this.dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists;
      `);

      const usersTableExists = usersTableExistsResult[0]?.exists || false;
      let userCount = 0;

      if (usersTableExists) {
        try {
          const userCountResult = await this.dataSource.query('SELECT COUNT(*) as count FROM users');
          userCount = parseInt(userCountResult[0]?.count || '0', 10);
        } catch (err) {
          // Table exists but query failed
          console.error('Error counting users:', err.message);
        }
      }

      return {
        status: 'ok',
        database: 'connected',
        usersTableExists,
        userCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('uptime')
  @ApiOperation({ summary: 'Get system uptime statistics' })
  @ApiResponse({ status: 200, description: 'Uptime statistics retrieved' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to calculate uptime for (default: 30)' })
  async getUptime(@Query('days') days?: number) {
    const daysNum = days ? parseInt(days.toString(), 10) : 30;
    return await this.uptimeMonitoringService.getUptimePercentage(daysNum);
  }

  @Get('uptime/stats')
  @ApiOperation({ summary: 'Get comprehensive uptime statistics' })
  @ApiResponse({ status: 200, description: 'Comprehensive uptime statistics' })
  async getUptimeStats() {
    return await this.uptimeMonitoringService.getUptimeStats();
  }
}

