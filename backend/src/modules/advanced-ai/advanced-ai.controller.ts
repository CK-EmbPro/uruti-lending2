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
import { AdvancedAIService } from './services/advanced-ai.service';
import {
  CreateAIModelDto,
  PredictDto,
  AIModelType,
} from './dto/advanced-ai.dto';
import { ModelStatus } from '../risk-modeling/dto/risk-modeling.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Advanced AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('advanced-ai')
export class AdvancedAIController {
  constructor(private readonly advancedAIService: AdvancedAIService) {}

  @Post('models')
  @ApiOperation({ summary: 'Create AI model' })
  @ApiResponse({ status: 201, description: 'AI model created successfully' })
  createModel(@Body() createDto: CreateAIModelDto) {
    return this.advancedAIService.createModel(createDto);
  }

  @Get('models')
  @ApiOperation({ summary: 'Get all AI models' })
  @ApiResponse({ status: 200, description: 'List of AI models' })
  findAllModels(
    @Query('modelType') modelType?: AIModelType,
    @Query('status') status?: ModelStatus,
  ) {
    return this.advancedAIService.findAllModels(modelType, status);
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Get AI model by ID' })
  @ApiResponse({ status: 200, description: 'AI model details' })
  findOneModel(@Param('id') id: string) {
    return this.advancedAIService.findOneModel(id);
  }

  @Get('models/:id/performance')
  @ApiOperation({ summary: 'Get model performance' })
  @ApiResponse({ status: 200, description: 'Model performance metrics' })
  getModelPerformance(@Param('id') id: string) {
    return this.advancedAIService.getModelPerformance(id);
  }

  @Post('predict')
  @ApiOperation({ summary: 'Make AI prediction' })
  @ApiResponse({ status: 200, description: 'Prediction result' })
  predict(@Body() predictDto: PredictDto) {
    return this.advancedAIService.predict(predictDto);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'Get AI predictions' })
  @ApiResponse({ status: 200, description: 'List of predictions' })
  getPredictions(
    @Query('modelId') modelId?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.advancedAIService.getPredictions(modelId, entityId, limit);
  }

  @Post('sentiment')
  @ApiOperation({ summary: 'Analyze sentiment' })
  @ApiResponse({ status: 200, description: 'Sentiment analysis result' })
  analyzeSentiment(@Body('text') text: string) {
    return this.advancedAIService.analyzeSentiment(text);
  }
}

