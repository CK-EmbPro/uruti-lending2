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
import { OnboardingAssistantService } from './services/onboarding-assistant.service';
import { GetOnboardingGuideDto } from './dto/onboarding-assistant.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('onboarding-assistant')
@ApiBearerAuth('JWT-auth')
@Controller('onboarding-assistant')
@UseGuards(CompanyGuard)
export class OnboardingAssistantController {
  constructor(private readonly onboardingService: OnboardingAssistantService) {}

  @Post('guide')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get personalized onboarding guide',
    description: 'Provides a step-by-step onboarding guide based on customer progress and requirements',
  })
  @ApiBody({ type: GetOnboardingGuideDto })
  @ApiResponse({
    status: 200,
    description: 'Onboarding guide retrieved successfully',
  })
  async getOnboardingGuide(
    @Body() dto: GetOnboardingGuideDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.onboardingService.getOnboardingGuide(dto, companyId);
  }
}

