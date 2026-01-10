import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimitingService } from './services/rate-limiting.service';
import { CreateRateLimitRuleDto } from './dto/rate-limiting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Rate Limiting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rate-limiting')
export class RateLimitingController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}

  @Post('rules')
  @ApiOperation({ summary: 'Create rate limit rule' })
  @ApiResponse({ status: 201, description: 'Rate limit rule created successfully' })
  createRule(@Body() createDto: CreateRateLimitRuleDto) {
    return this.rateLimitingService.createRule(createDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all rate limit rules' })
  @ApiResponse({ status: 200, description: 'List of rate limit rules' })
  findAllRules(@Query('isActive') isActive?: boolean) {
    return this.rateLimitingService.findAllRules(
      isActive !== undefined ? isActive === true : undefined,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get rate limiting statistics' })
  @ApiResponse({ status: 200, description: 'Rate limiting statistics' })
  getStats(@Query('ruleId') ruleId?: string) {
    return this.rateLimitingService.getStats(ruleId);
  }
}

