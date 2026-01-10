import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FinancialHealthService } from './services/financial-health.service';
import { CalculateFinancialHealthDto } from './dto/financial-health.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('financial-health')
@ApiBearerAuth('JWT-auth')
@Controller('financial-health')
@UseGuards(CompanyGuard)
export class FinancialHealthController {
  constructor(private readonly financialHealthService: FinancialHealthService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate financial health score',
    description: 'Calculates comprehensive financial health score based on credit history, payment behavior, debt management, and loan utilization',
  })
  @ApiBody({ type: CalculateFinancialHealthDto })
  @ApiResponse({
    status: 200,
    description: 'Financial health score calculated successfully',
  })
  async calculateFinancialHealth(
    @Body() dto: CalculateFinancialHealthDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.financialHealthService.calculateFinancialHealth(dto, companyId);
  }
}

