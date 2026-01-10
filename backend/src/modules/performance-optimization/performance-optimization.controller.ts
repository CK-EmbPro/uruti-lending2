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
import { PerformanceOptimizationService } from './services/performance-optimization.service';
import { PerformanceProfileDto } from './dto/performance-optimization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Performance Optimization')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('performance-optimization')
export class PerformanceOptimizationController {
  constructor(private readonly performanceService: PerformanceOptimizationService) {}

  @Post('profiling/start')
  @ApiOperation({ summary: 'Start performance profiling' })
  @ApiResponse({ status: 201, description: 'Profiling started' })
  startProfiling(@Body() profileDto: PerformanceProfileDto) {
    return this.performanceService.startProfiling(profileDto);
  }

  @Post('profiling/:id/stop')
  @ApiOperation({ summary: 'Stop performance profiling' })
  @ApiResponse({ status: 200, description: 'Profiling stopped' })
  stopProfiling(@Param('id') id: string) {
    return this.performanceService.stopProfiling(id);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get optimization recommendations' })
  @ApiResponse({ status: 200, description: 'List of recommendations' })
  getRecommendations(@Query('profileId') profileId?: string) {
    return this.performanceService.getRecommendations(profileId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get performance statistics' })
  @ApiResponse({ status: 200, description: 'Performance statistics' })
  getPerformanceStats() {
    return this.performanceService.getPerformanceStats();
  }
}

