import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdvancedCachingService } from './services/advanced-caching.service';
import { CacheConfigDto } from './dto/advanced-caching.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Advanced Caching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('advanced-caching')
export class AdvancedCachingController {
  constructor(private readonly cachingService: AdvancedCachingService) {}

  @Post('set')
  @ApiOperation({ summary: 'Set cache entry' })
  @ApiResponse({ status: 201, description: 'Cache entry set successfully' })
  setCache(@Body() config: CacheConfigDto) {
    return this.cachingService.set(config);
  }

  @Get('get/:key')
  @ApiOperation({ summary: 'Get cache entry' })
  @ApiResponse({ status: 200, description: 'Cache entry' })
  getCache(@Param('key') key: string) {
    return this.cachingService.get(key);
  }

  @Delete('delete/:key')
  @ApiOperation({ summary: 'Delete cache entry' })
  @ApiResponse({ status: 200, description: 'Cache entry deleted' })
  deleteCache(@Param('key') key: string) {
    return this.cachingService.delete(key);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared' })
  clearCache(@Query('pattern') pattern?: string) {
    return this.cachingService.clear(pattern);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  getStats() {
    return this.cachingService.getStats();
  }

  @Post('invalidate')
  @ApiOperation({ summary: 'Invalidate cache by pattern' })
  @ApiResponse({ status: 200, description: 'Cache invalidated' })
  invalidateCache(@Body('pattern') pattern: string) {
    return this.cachingService.invalidatePattern(pattern);
  }
}
