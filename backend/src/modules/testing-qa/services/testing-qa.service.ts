import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestSuite } from '../entities/test-suite.entity';
import { TestResult } from '../entities/test-result.entity';
import {
  CreateTestSuiteDto,
  RunTestSuiteDto,
  TestResult as TestResultDto,
  TestType,
  TestStatus,
} from '../dto/testing-qa.dto';
import axios from 'axios';

@Injectable()
export class TestingQAService {
  private readonly logger = new Logger(TestingQAService.name);

  constructor(
    @InjectRepository(TestSuite)
    private testSuiteRepository: Repository<TestSuite>,
    @InjectRepository(TestResult)
    private testResultRepository: Repository<TestResult>,
  ) {}

  async createTestSuite(createDto: CreateTestSuiteDto): Promise<TestSuite> {
    const testCases = (createDto.testCases || []).map((tc, index) => ({
      id: `tc-${Date.now()}-${index}`,
      ...tc,
    }));

    const suite = this.testSuiteRepository.create({
      ...createDto,
      testCases,
    });

    return this.testSuiteRepository.save(suite);
  }

  async findAllTestSuites(testType?: TestType): Promise<TestSuite[]> {
    const where: any = {};
    if (testType) where.testType = testType;

    return this.testSuiteRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneTestSuite(id: string): Promise<TestSuite> {
    const suite = await this.testSuiteRepository.findOne({ where: { id } });
    if (!suite) {
      throw new NotFoundException(`Test suite with ID ${id} not found`);
    }
    return suite;
  }

  async runTestSuite(suiteId: string, runDto: RunTestSuiteDto): Promise<TestResult> {
    const suite = await this.findOneTestSuite(suiteId);
    const startTime = Date.now();

    const result = this.testResultRepository.create({
      testSuiteId: suite.id,
      testSuiteName: suite.name,
      status: TestStatus.RUNNING,
      totalTests: suite.testCases.length,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      testCaseResults: [],
      executedAt: new Date(),
    });

    const savedResult = await this.testResultRepository.save(result);

    try {
      const testCaseResults = [];

      for (const testCase of suite.testCases) {
        // Filter if specific test case IDs provided
        if (runDto.testCaseIds && !runDto.testCaseIds.includes(testCase.id)) {
          testCaseResults.push({
            testCaseId: testCase.id,
            name: testCase.name,
            status: TestStatus.SKIPPED,
            duration: 0,
          });
          savedResult.skippedTests += 1;
          continue;
        }

        const testStartTime = Date.now();
        try {
          // Execute test case
          await this.executeTestCase(testCase, runDto.environment);
          const testDuration = Date.now() - testStartTime;

          testCaseResults.push({
            testCaseId: testCase.id,
            name: testCase.name,
            status: TestStatus.PASSED,
            duration: testDuration,
          });

          savedResult.passedTests += 1;
        } catch (error: any) {
          const testDuration = Date.now() - testStartTime;

          testCaseResults.push({
            testCaseId: testCase.id,
            name: testCase.name,
            status: TestStatus.FAILED,
            duration: testDuration,
            errorMessage: error.message,
          });

          savedResult.failedTests += 1;
        }
      }

      const duration = Date.now() - startTime;

      savedResult.status = savedResult.failedTests > 0 ? TestStatus.FAILED : TestStatus.PASSED;
      savedResult.duration = duration;
      savedResult.testCaseResults = testCaseResults;

      // Update suite statistics
      suite.executionCount += 1;
      suite.passCount += savedResult.passedTests;
      suite.failCount += savedResult.failedTests;
      suite.lastExecutedAt = new Date();
      await this.testSuiteRepository.save(suite);
    } catch (error: any) {
      savedResult.status = TestStatus.FAILED;
      savedResult.errorMessage = error.message;
    } finally {
      savedResult.duration = Date.now() - startTime;
      return this.testResultRepository.save(savedResult);
    }
  }

  private async executeTestCase(testCase: any, environment?: string): Promise<void> {
    // TODO: Implement actual test execution
    // This would make HTTP requests, validate responses, etc.
    const baseUrl = environment === 'production'
      ? process.env.API_URL_PROD
      : environment === 'staging'
      ? process.env.API_URL_STAGING
      : 'http://localhost:3000';

    try {
      const response = await axios({
        method: testCase.method.toLowerCase(),
        url: `${baseUrl}${testCase.endpoint}`,
        timeout: 10000,
      });

      if (response.status !== testCase.expectedStatus) {
        throw new Error(`Expected status ${testCase.expectedStatus}, got ${response.status}`);
      }

      // Validate assertions if provided
      if (testCase.assertions) {
        // TODO: Implement assertion validation
      }
    } catch (error: any) {
      throw new Error(`Test case failed: ${error.message}`);
    }
  }

  async getTestResults(suiteId?: string, limit: number = 50): Promise<TestResult[]> {
    const where: any = {};
    if (suiteId) where.testSuiteId = suiteId;

    return this.testResultRepository.find({
      where,
      order: { executedAt: 'DESC' },
      take: limit,
    });
  }

  async getTestStats(): Promise<Record<string, any>> {
    const totalSuites = await this.testSuiteRepository.count();
    const activeSuites = await this.testSuiteRepository.count({ where: { isActive: true } });
    const totalResults = await this.testResultRepository.count();
    const passedResults = await this.testResultRepository.count({ where: { status: TestStatus.PASSED } });
    const failedResults = await this.testResultRepository.count({ where: { status: TestStatus.FAILED } });

    return {
      totalSuites,
      activeSuites,
      totalResults,
      passedResults,
      failedResults,
      passRate: totalResults > 0 ? passedResults / totalResults : 0,
    };
  }
}

