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
import { ApprovalPredictorService } from './services/approval-predictor.service';
import { PredictApprovalDto } from './dto/approval-probability.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('approval-predictor')
@ApiBearerAuth('JWT-auth')
@Controller('approval-predictor')
@UseGuards(CompanyGuard)
export class ApprovalPredictorController {
  constructor(private readonly predictorService: ApprovalPredictorService) {}

  @Post('predict')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Predict loan approval probability',
    description: 'Uses ML and rule-based analysis to predict the probability of loan approval before submission',
  })
  @ApiBody({ type: PredictApprovalDto })
  @ApiResponse({
    status: 200,
    description: 'Approval probability predicted successfully',
  })
  async predictApproval(
    @Body() dto: PredictApprovalDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.predictorService.predictApproval(dto, companyId);
  }
}

