import {
  Controller,
  Post,
  Get,
  Body,
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
import { I18nService } from './services/i18n.service';
import {
  TranslateRequestDto,
  SetUserLanguageDto,
} from './dto/i18n.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('i18n')
@ApiBearerAuth('JWT-auth')
@Controller('i18n')
@UseGuards(CompanyGuard)
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Post('translate')
  @ApiOperation({
    summary: 'Translate text',
    description: 'Translates text to the target language. Supports 10 languages including English, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Arabic, and Hindi.',
  })
  @ApiBody({ type: TranslateRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Text translated successfully',
  })
  async translate(@Body() dto: TranslateRequestDto) {
    return await this.i18nService.translate(dto);
  }

  @Post('preferences')
  @ApiOperation({
    summary: 'Set user language preference',
    description: 'Sets the preferred language for a user. This preference will be used for all future communications.',
  })
  @ApiBody({ type: SetUserLanguageDto })
  @ApiResponse({
    status: 200,
    description: 'Language preference updated successfully',
  })
  async setUserLanguage(
    @Body() dto: SetUserLanguageDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || 'anonymous';
    return await this.i18nService.setUserLanguage(userId, companyId, dto);
  }

  @Get('preferences')
  @ApiOperation({
    summary: 'Get user language preference',
    description: 'Returns the current language preference for the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Language preference retrieved successfully',
  })
  async getUserLanguage(@Request() req: any) {
    const companyId = req.user?.companyId || req.companyId;
    const userId = req.user?.id || 'anonymous';
    const language = await this.i18nService.getUserLanguage(userId, companyId);
    return { language };
  }

  @Get('supported-languages')
  @ApiOperation({
    summary: 'Get supported languages',
    description: 'Returns list of all supported languages with codes and native names.',
  })
  @ApiResponse({
    status: 200,
    description: 'Supported languages retrieved successfully',
  })
  async getSupportedLanguages() {
    return await this.i18nService.getSupportedLanguages();
  }
}

