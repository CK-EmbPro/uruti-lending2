import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AlternativeCreditScoringService } from './services/alternative-credit-scoring.service';
import {
  CalculateAlternativeScoreDto,
} from './dto/alternative-credit-scoring.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('alternative-credit-scoring')
@ApiBearerAuth('JWT-auth')
@Controller('alternative-credit-scoring')
@UseGuards(CompanyGuard)
export class AlternativeCreditScoringController {
  constructor(
    private readonly scoringService: AlternativeCreditScoringService,
  ) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate alternative credit score',
    description: 'Calculates alternative credit score using non-traditional data sources including transaction history, utility payments, rental payments, cash flow analysis, and mobile phone usage patterns.',
  })
  @ApiBody({ type: CalculateAlternativeScoreDto })
  @ApiResponse({
    status: 201,
    description: 'Alternative credit score calculated successfully',
  })
  async calculateAlternativeScore(
    @Body() dto: CalculateAlternativeScoreDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.scoringService.calculateAlternativeScore(dto, companyId);
  }

  @Get('scores/:customerId')
  @ApiOperation({
    summary: 'Get alternative credit score',
    description: 'Returns the latest alternative credit score for a customer with score breakdown, risk factors, and recommendations.',
  })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  @ApiResponse({
    status: 200,
    description: 'Alternative credit score retrieved successfully',
  })
  async getAlternativeScore(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.scoringService.getAlternativeScore(customerId, companyId);
  }
}

