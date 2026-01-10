import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PreQualificationService } from './pre-qualification.service';
import {
  PreQualificationCheckDto,
  PreQualificationResultDto,
} from './dto/pre-qualification-check.dto';

@ApiTags('Pre-Qualification')
@Controller('pre-qualification')
export class PreQualificationController {
  constructor(
    private readonly preQualificationService: PreQualificationService,
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check pre-qualification eligibility' })
  @ApiResponse({
    status: 200,
    description: 'Pre-qualification result',
    type: PreQualificationResultDto,
  })
  async checkPreQualification(
    @Body() dto: PreQualificationCheckDto,
  ): Promise<PreQualificationResultDto> {
    return await this.preQualificationService.checkPreQualification(dto);
  }

  @Get('offer/:token')
  @ApiOperation({ summary: 'Get pre-qualification offer by token' })
  @ApiResponse({
    status: 200,
    description: 'Pre-qualification offer details',
  })
  async getOffer(@Param('token') token: string) {
    const offer = await this.preQualificationService.getByToken(token);
    if (!offer) {
      return { error: 'Offer not found or expired' };
    }
    return {
      ...offer,
      preQualificationResult: JSON.parse(offer.preQualificationResult || '{}'),
    };
  }

  @Post('convert/:token')
  @ApiOperation({ summary: 'Convert pre-qualification to application' })
  @ApiResponse({
    status: 200,
    description: 'Conversion successful',
  })
  async convertToApplication(
    @Param('token') token: string,
    @Body() body: { applicationId: string },
  ) {
    await this.preQualificationService.markAsConverted(
      token,
      body.applicationId,
    );
    return { success: true, message: 'Pre-qualification converted to application' };
  }
}

