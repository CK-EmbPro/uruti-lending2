import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CalculationService } from './calculation.service';

class CalculateEmiDto {
  principal: number;
  rateOfInterest: number;
  tenureInMonths: number;
}

class CalculateInterestDto {
  principal: number;
  rateOfInterest: number;
  fromDate: string;
  toDate: string;
  dayCountConvention?: string;
}

class CalculatePenaltyDto {
  principal: number;
  penaltyRate: number;
  daysPastDue: number;
}

@ApiTags('calculations')
@ApiBearerAuth('JWT-auth')
@Controller('calculations')
export class CalculationController {
  constructor(private readonly calculationService: CalculationService) {}

  @Post('emi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate EMI', description: 'Calculates Equated Monthly Installment (EMI) using reducing balance method' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        principal: { type: 'number', example: 100000, description: 'Loan principal amount' },
        rateOfInterest: { type: 'number', example: 12.5, description: 'Annual interest rate (percentage)' },
        tenureInMonths: { type: 'number', example: 12, description: 'Loan tenure in months' },
      },
      required: ['principal', 'rateOfInterest', 'tenureInMonths'],
    },
  })
  @ApiResponse({ status: 200, description: 'EMI calculated successfully', schema: { type: 'object', properties: { emi: { type: 'number', example: 8884.87 } } } })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  calculateEmi(@Body() dto: CalculateEmiDto) {
    return {
      emi: this.calculationService.calculateEMI(
        dto.principal,
        dto.rateOfInterest,
        dto.tenureInMonths,
        'Monthly',
      ),
    };
  }

  @Post('interest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate interest', description: 'Calculates interest amount for a given period using specified day count convention' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        principal: { type: 'number', example: 100000, description: 'Principal amount' },
        rateOfInterest: { type: 'number', example: 12.5, description: 'Annual interest rate (percentage)' },
        fromDate: { type: 'string', format: 'date', example: '2024-01-01', description: 'Start date (ISO 8601)' },
        toDate: { type: 'string', format: 'date', example: '2024-01-31', description: 'End date (ISO 8601)' },
        dayCountConvention: { type: 'string', example: 'Actual/365', description: 'Day count convention (default: Actual/365)' },
      },
      required: ['principal', 'rateOfInterest', 'fromDate', 'toDate'],
    },
  })
  @ApiResponse({ status: 200, description: 'Interest calculated successfully', schema: { type: 'object', properties: { interest: { type: 'number', example: 1061.64 } } } })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  calculateInterest(@Body() dto: CalculateInterestDto) {
    const fromDate = new Date(dto.fromDate);
    const toDate = new Date(dto.toDate);
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      interest: this.calculationService.calculateInterest(
        dto.principal,
        dto.rateOfInterest,
        days,
        dto.dayCountConvention || 'Actual/365',
        toDate,
      ),
    };
  }

  @Post('penalty')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate penalty', description: 'Calculates penalty amount based on days past due' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        principal: { type: 'number', example: 100000, description: 'Principal amount' },
        penaltyRate: { type: 'number', example: 2.0, description: 'Penalty interest rate (percentage)' },
        daysPastDue: { type: 'number', example: 30, description: 'Number of days past due' },
      },
      required: ['principal', 'penaltyRate', 'daysPastDue'],
    },
  })
  @ApiResponse({ status: 200, description: 'Penalty calculated successfully', schema: { type: 'object', properties: { penalty: { type: 'number', example: 164.38 } } } })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  calculatePenalty(@Body() dto: CalculatePenaltyDto) {
    return {
      penalty: this.calculationService.calculatePenalty(
        dto.principal,
        dto.penaltyRate,
        dto.daysPastDue,
      ),
    };
  }
}

