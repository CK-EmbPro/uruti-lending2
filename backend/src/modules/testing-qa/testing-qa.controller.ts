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
import { TestingQAService } from './services/testing-qa.service';
import { CreateTestSuiteDto, RunTestSuiteDto, TestType } from './dto/testing-qa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Testing & QA')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('testing-qa')
export class TestingQAController {
  constructor(private readonly testingQAService: TestingQAService) {}

  @Post('test-suites')
  @ApiOperation({ summary: 'Create test suite' })
  @ApiResponse({ status: 201, description: 'Test suite created successfully' })
  createTestSuite(@Body() createDto: CreateTestSuiteDto) {
    return this.testingQAService.createTestSuite(createDto);
  }

  @Get('test-suites')
  @ApiOperation({ summary: 'Get all test suites' })
  @ApiResponse({ status: 200, description: 'List of test suites' })
  findAllTestSuites(@Query('testType') testType?: TestType) {
    return this.testingQAService.findAllTestSuites(testType);
  }

  @Get('test-suites/:id')
  @ApiOperation({ summary: 'Get test suite by ID' })
  @ApiResponse({ status: 200, description: 'Test suite details' })
  findOneTestSuite(@Param('id') id: string) {
    return this.testingQAService.findOneTestSuite(id);
  }

  @Post('test-suites/:id/run')
  @ApiOperation({ summary: 'Run test suite' })
  @ApiResponse({ status: 200, description: 'Test suite execution started' })
  runTestSuite(
    @Param('id') id: string,
    @Body() runDto: RunTestSuiteDto,
  ) {
    return this.testingQAService.runTestSuite(id, runDto);
  }

  @Get('test-results')
  @ApiOperation({ summary: 'Get test results' })
  @ApiResponse({ status: 200, description: 'List of test results' })
  getTestResults(
    @Query('suiteId') suiteId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.testingQAService.getTestResults(suiteId, limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get testing statistics' })
  @ApiResponse({ status: 200, description: 'Testing statistics' })
  getTestStats() {
    return this.testingQAService.getTestStats();
  }
}

