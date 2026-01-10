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
import { DynamicPricingService } from './services/dynamic-pricing.service';
import { CalculateDynamicPriceDto } from './dto/dynamic-pricing.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('dynamic-pricing')
@ApiBearerAuth('JWT-auth')
@Controller('dynamic-pricing')
@UseGuards(CompanyGuard)
export class DynamicPricingController {
  constructor(private readonly pricingService: DynamicPricingService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate dynamic personalized pricing',
    description: 'Calculates personalized interest rate and fees based on customer profile, credit score, relationship, and other factors. Provides rate adjustments and recommendations.',
  })
  @ApiBody({ type: CalculateDynamicPriceDto })
  @ApiResponse({
    status: 200,
    description: 'Dynamic pricing calculated successfully',
  })
  async calculatePrice(
    @Body() dto: CalculateDynamicPriceDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.pricingService.calculatePrice(dto, companyId);
  }
}

