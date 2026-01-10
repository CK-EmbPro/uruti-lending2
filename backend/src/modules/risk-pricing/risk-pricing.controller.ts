import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RiskBasedPricingService } from './services/risk-based-pricing.service';
import {
  PricingQuoteDto,
  DynamicLimitDto,
  PortfolioOptimizationDto,
  StressTestScenarioDto,
  CalculatePricingRequestDto,
  UpdateLimitRequestDto,
} from './dto/risk-based-pricing.dto';

@ApiTags('Risk-Based Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/risk-pricing')
export class RiskPricingController {
  constructor(private readonly pricingService: RiskBasedPricingService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate personalized interest rate for a loan application' })
  @ApiResponse({
    status: 200,
    description: 'Pricing quote calculated',
    type: PricingQuoteDto,
  })
  async calculatePricing(@Body() request: CalculatePricingRequestDto): Promise<PricingQuoteDto> {
    return await this.pricingService.calculatePricing(request);
  }

  @Get('dynamic-limit/:customerId')
  @ApiOperation({ summary: 'Get dynamic credit limit for a customer' })
  @ApiResponse({
    status: 200,
    description: 'Dynamic limit information',
    type: DynamicLimitDto,
  })
  async getDynamicLimit(@Param('customerId') customerId: string): Promise<DynamicLimitDto> {
    return await this.pricingService.getDynamicLimit(customerId);
  }

  @Post('update-limit')
  @ApiOperation({ summary: 'Update customer credit limit' })
  @ApiResponse({
    status: 200,
    description: 'Limit updated successfully',
    type: DynamicLimitDto,
  })
  async updateLimit(@Body() request: UpdateLimitRequestDto): Promise<DynamicLimitDto> {
    return await this.pricingService.updateLimit(request);
  }

  @Get('portfolio-optimization')
  @ApiOperation({ summary: 'Get portfolio-level risk optimization metrics' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio optimization data',
    type: PortfolioOptimizationDto,
  })
  async getPortfolioOptimization(): Promise<PortfolioOptimizationDto> {
    return await this.pricingService.getPortfolioOptimization();
  }

  @Post('stress-test')
  @ApiOperation({ summary: 'Run stress test scenario' })
  @ApiResponse({
    status: 200,
    description: 'Stress test results',
    type: StressTestScenarioDto,
  })
  async runStressTest(
    @Body('scenarioName') scenarioName: string,
    @Body('unemploymentRate') unemploymentRate: number,
  ): Promise<StressTestScenarioDto> {
    return await this.pricingService.runStressTest(scenarioName, unemploymentRate);
  }
}

