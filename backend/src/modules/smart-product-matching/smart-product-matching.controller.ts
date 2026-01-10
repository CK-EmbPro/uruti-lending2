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
import { SmartProductMatchingService } from './services/smart-product-matching.service';
import { MatchProductsDto } from './dto/product-matching.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('smart-product-matching')
@ApiBearerAuth('JWT-auth')
@Controller('smart-product-matching')
@UseGuards(CompanyGuard)
export class SmartProductMatchingController {
  constructor(private readonly matchingService: SmartProductMatchingService) {}

  @Post('match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Match loan products to customer profile',
    description: 'Intelligently matches loan products to customer profile, needs, and eligibility. Provides best match and alternatives.',
  })
  @ApiBody({ type: MatchProductsDto })
  @ApiResponse({
    status: 200,
    description: 'Products matched successfully',
  })
  async matchProducts(
    @Body() dto: MatchProductsDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.matchingService.matchProducts(dto, companyId);
  }
}

