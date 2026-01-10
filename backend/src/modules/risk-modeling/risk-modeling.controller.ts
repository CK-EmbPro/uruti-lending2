import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RiskModelingService } from './services/risk-modeling.service';
import {
  CreateRiskModelDto,
  TrainModelDto,
  PredictRiskDto,
  ModelType,
  ModelStatus,
} from './dto/risk-modeling.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Risk Modeling')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('risk-modeling')
export class RiskModelingController {
  constructor(private readonly riskModelingService: RiskModelingService) {}

  @Post('models')
  @ApiOperation({ summary: 'Create risk model' })
  @ApiResponse({ status: 201, description: 'Risk model created successfully' })
  createModel(
    @Body() createDto: CreateRiskModelDto,
    @CurrentUser() user: any,
  ) {
    return this.riskModelingService.createModel(createDto, user.id);
  }

  @Get('models')
  @ApiOperation({ summary: 'Get all risk models' })
  @ApiResponse({ status: 200, description: 'List of risk models' })
  findAllModels(
    @Query('modelType') modelType?: ModelType,
    @Query('status') status?: ModelStatus,
  ) {
    return this.riskModelingService.findAllModels(modelType, status);
  }

  @Get('models/active/:modelType')
  @ApiOperation({ summary: 'Get active model by type' })
  @ApiResponse({ status: 200, description: 'Active risk model' })
  getActiveModel(@Param('modelType') modelType: ModelType) {
    return this.riskModelingService.getActiveModel(modelType);
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get risk model by ID' })
  @ApiResponse({ status: 200, description: 'Risk model details' })
  findOneModel(@Param('id') id: string) {
    return this.riskModelingService.findOneModel(id);
  }

  @Get('models/:id/performance')
  @ApiOperation({ summary: 'Get model performance metrics' })
  @ApiResponse({ status: 200, description: 'Model performance' })
  getModelPerformance(@Param('id') id: string) {
    return this.riskModelingService.getModelPerformance(id);
  }

  @Post('models/train')
  @ApiOperation({ summary: 'Train risk model' })
  @ApiResponse({ status: 200, description: 'Model training started' })
  trainModel(
    @Body() trainDto: TrainModelDto,
    @CurrentUser() user: any,
  ) {
    return this.riskModelingService.trainModel(trainDto, user.id);
  }

  @Post('predict')
  @ApiOperation({ summary: 'Predict risk' })
  @ApiResponse({ status: 200, description: 'Risk prediction' })
  predictRisk(@Body() predictDto: PredictRiskDto) {
    return this.riskModelingService.predictRisk(predictDto);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get risk predictions' })
  @ApiResponse({ status: 200, description: 'List of risk predictions' })
  getPredictions(
    @Query('loanId') loanId?: string,
    @Query('customerId') customerId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.riskModelingService.getPredictions(loanId, customerId, limit);
  }

  @Post('early-warnings/detect/:loanId')
  @ApiOperation({ summary: 'Detect early warning indicators for loan' })
  @ApiResponse({ status: 200, description: 'Early warning indicators detected' })
  detectEarlyWarnings(@Param('loanId') loanId: string) {
    return this.riskModelingService.detectEarlyWarnings(loanId);
  }

  @Get('early-warnings')
  @ApiOperation({ summary: 'Get early warning indicators' })
  @ApiResponse({ status: 200, description: 'List of early warning indicators' })
  getEarlyWarnings(
    @Query('loanId') loanId?: string,
    @Query('isResolved') isResolved?: boolean,
  ) {
    return this.riskModelingService.getEarlyWarnings(
      loanId,
      isResolved !== undefined ? isResolved === true : undefined,
    );
  }

  @Patch('early-warnings/:id/resolve')
  @ApiOperation({ summary: 'Resolve early warning indicator' })
  @ApiResponse({ status: 200, description: 'Early warning resolved' })
  resolveEarlyWarning(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ) {
    return this.riskModelingService.resolveEarlyWarning(id, user.id, notes);
  }
}

