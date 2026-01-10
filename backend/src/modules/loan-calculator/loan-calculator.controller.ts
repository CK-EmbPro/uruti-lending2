import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LoanCalculatorService } from './services/loan-calculator.service';
import { RepaymentStructureService } from './services/repayment-structure.service';
import {
  LoanCalculatorDto,
  AmortizationScheduleDto,
  LoanEligibilityDto,
  LoanComparisonDto,
  EarlyRepaymentCalculatorDto,
  RateEstimatorDto,
} from './dto/loan-calculator.dto';
import { LoanRefinancingDto } from './dto/loan-refinancing.dto';
import { CostComparisonDto, CostComparisonResultDto } from './dto/cost-comparison.dto';

@ApiTags('loan-calculator')
@Controller('loan-calculator')
export class LoanCalculatorController {
  constructor(
    private readonly loanCalculatorService: LoanCalculatorService,
    private readonly repaymentStructureService: RepaymentStructureService,
  ) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate loan EMI and details',
    description: 'Calculates EMI, total interest, total amount, and effective rate for a loan',
  })
  @ApiBody({ type: LoanCalculatorDto })
  @ApiResponse({
    status: 200,
    description: 'Loan calculation completed successfully',
  })
  async calculateLoan(@Body() dto: LoanCalculatorDto) {
    return await this.loanCalculatorService.calculateLoan(dto);
  }

  @Post('calculate-with-schedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate loan with amortization schedule',
    description: 'Calculates loan details including month-by-month amortization schedule',
  })
  @ApiBody({ type: AmortizationScheduleDto })
  @ApiResponse({
    status: 200,
    description: 'Loan calculation with schedule completed successfully',
  })
  async calculateLoanWithSchedule(@Body() dto: AmortizationScheduleDto) {
    return await this.loanCalculatorService.calculateLoanWithSchedule(dto);
  }

  @Post('check-eligibility')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check loan eligibility',
    description: 'Checks if a customer is eligible for a loan based on income, expenses, and credit profile',
  })
  @ApiBody({ type: LoanEligibilityDto })
  @ApiResponse({
    status: 200,
    description: 'Eligibility check completed successfully',
  })
  async checkEligibility(
    @Body() dto: LoanEligibilityDto,
    @Request() req?: any,
  ) {
    const companyId = req?.user?.companyId || req?.companyId;
    return await this.loanCalculatorService.checkEligibility(dto, companyId);
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare multiple loan products',
    description: 'Compares multiple loan products side-by-side to help customers choose the best option',
  })
  @ApiBody({ type: LoanComparisonDto })
  @ApiResponse({
    status: 200,
    description: 'Loan comparison completed successfully',
  })
  async compareLoans(@Body() dto: LoanComparisonDto) {
    return await this.loanCalculatorService.compareLoans(dto);
  }

  @Post('early-repayment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate early repayment savings',
    description: 'Calculates interest savings and time saved by making early repayments',
  })
  @ApiBody({ type: EarlyRepaymentCalculatorDto })
  @ApiResponse({
    status: 200,
    description: 'Early repayment calculation completed successfully',
  })
  async calculateEarlyRepayment(@Body() dto: EarlyRepaymentCalculatorDto) {
    return await this.loanCalculatorService.calculateEarlyRepayment(dto);
  }

  @Post('estimate-rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Estimate interest rate',
    description: 'Estimates likely interest rate based on customer profile before applying',
  })
  @ApiBody({ type: RateEstimatorDto })
  @ApiResponse({
    status: 200,
    description: 'Rate estimation completed successfully',
  })
  async estimateRate(@Body() dto: RateEstimatorDto) {
    return await this.loanCalculatorService.estimateRate(dto);
  }

  @Post('refinancing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate loan refinancing analysis',
    description: 'Analyzes whether refinancing a loan is beneficial, including savings, break-even period, and recommendations',
  })
  @ApiBody({ type: LoanRefinancingDto })
  @ApiResponse({
    status: 200,
    description: 'Refinancing analysis completed successfully',
  })
  async calculateRefinancing(@Body() dto: LoanRefinancingDto) {
    return await this.loanCalculatorService.calculateRefinancing(dto);
  }

  @Get('quick-calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick loan calculation (GET endpoint)',
    description: 'Quick EMI calculation using query parameters (public endpoint)',
  })
  @ApiQuery({ name: 'amount', type: Number, description: 'Loan amount', example: 100000 })
  @ApiQuery({ name: 'rate', type: Number, description: 'Interest rate (%)', example: 12.5 })
  @ApiQuery({ name: 'tenure', type: Number, description: 'Tenure in months', example: 24 })
  @ApiResponse({
    status: 200,
    description: 'Quick calculation completed successfully',
  })
  async quickCalculate(
    @Query('amount') amount: string,
    @Query('rate') rate: string,
    @Query('tenure') tenure: string,
  ) {
    const loanAmount = parseFloat(amount);
    const interestRate = parseFloat(rate);
    const tenureMonths = parseInt(tenure, 10);

    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(tenureMonths)) {
      throw new Error('Invalid parameters');
    }

    return await this.loanCalculatorService.calculateLoan({
      loanAmount,
      interestRate,
      tenureMonths,
    });
  }

  @Post('compare-repayment-structures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare repayment structures',
    description: 'Compares all repayment structures (Fixed, Graduated, Seasonal, Bullet) side-by-side showing total cost, monthly payments, and payment schedules',
  })
  @ApiBody({ type: CostComparisonDto })
  @ApiResponse({
    status: 200,
    description: 'Repayment structure comparison completed successfully',
    type: CostComparisonResultDto,
  })
  async compareRepaymentStructures(@Body() dto: CostComparisonDto): Promise<CostComparisonResultDto> {
    const results = this.repaymentStructureService.calculateAllStructures(dto);

    // Determine summary
    const structures = [
      { type: 'FIXED', result: results.fixed },
      { type: 'GRADUATED', result: results.graduated },
      { type: 'SEASONAL', result: results.seasonal },
      { type: 'BULLET', result: results.bullet },
    ];

    const cheapest = structures.reduce((min, curr) =>
      curr.result.totalCost < min.result.totalCost ? curr : min,
    );
    const mostExpensive = structures.reduce((max, curr) =>
      curr.result.totalCost > max.result.totalCost ? curr : max,
    );

    const lowestMonthly = structures.reduce((min, curr) =>
      curr.result.minPayment < min.result.minPayment ? curr : min,
    );
    const highestMonthly = structures.reduce((max, curr) =>
      curr.result.maxPayment > max.result.maxPayment ? curr : max,
    );

    return {
      fixed: results.fixed,
      graduated: results.graduated,
      seasonal: results.seasonal,
      bullet: results.bullet,
      summary: {
        cheapest: cheapest.type,
        mostExpensive: mostExpensive.type,
        lowestMonthlyPayment: {
          structure: lowestMonthly.type,
          amount: lowestMonthly.result.minPayment,
        },
        highestMonthlyPayment: {
          structure: highestMonthly.type,
          amount: highestMonthly.result.maxPayment,
        },
      },
    };
  }
}

