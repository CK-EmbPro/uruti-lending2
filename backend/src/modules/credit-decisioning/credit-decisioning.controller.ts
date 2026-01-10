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
import { CreditDecisioningService } from './services/credit-decisioning.service';
import { CreditDecisionRequestDto } from './dto/credit-decision.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('credit-decisioning')
@ApiBearerAuth('JWT-auth')
@Controller('credit-decisioning')
@UseGuards(CompanyGuard)
export class CreditDecisioningController {
  constructor(private readonly decisioningService: CreditDecisioningService) {}

  @Post('decide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Make automated credit decision',
    description: 'Automatically approves, rejects, or refers loan applications based on risk assessment and eligibility criteria. Returns decision with approved terms if approved.',
  })
  @ApiBody({ type: CreditDecisionRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Credit decision made successfully',
  })
  async makeDecision(
    @Body() dto: CreditDecisionRequestDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.decisioningService.makeDecision(dto, companyId);
  }
}

