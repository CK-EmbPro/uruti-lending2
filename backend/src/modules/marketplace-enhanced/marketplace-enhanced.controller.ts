import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceEnhancedService } from './services/marketplace-enhanced.service';
import {
  CreateMarketplaceListingDto,
  MarketplaceFilterDto,
} from './dto/marketplace-enhanced.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Marketplace Enhanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace-enhanced')
export class MarketplaceEnhancedController {
  constructor(private readonly marketplaceService: MarketplaceEnhancedService) {}

  @Post('listings')
  @ApiOperation({ summary: 'Create marketplace listing' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  createListing(@Body() createDto: CreateMarketplaceListingDto) {
    return this.marketplaceService.createListing(createDto);
  }

  @Get('listings')
  @ApiOperation({ summary: 'Get all marketplace listings' })
  @ApiResponse({ status: 200, description: 'List of listings' })
  findAllListings(@Query() filter: MarketplaceFilterDto) {
    return this.marketplaceService.findAllListings(filter);
  }

  @Get('listings/featured')
  @ApiOperation({ summary: 'Get featured listings' })
  @ApiResponse({ status: 200, description: 'List of featured listings' })
  findFeaturedListings(@Query('limit') limit?: number) {
    return this.marketplaceService.findFeaturedListings(limit);
  }

  @Get('listings/:id')
  @ApiOperation({ summary: 'Get marketplace listing by ID' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  findOneListing(@Param('id') id: string) {
    return this.marketplaceService.findOneListing(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get marketplace statistics' })
  @ApiResponse({ status: 200, description: 'Marketplace statistics' })
  getMarketplaceStats() {
    return this.marketplaceService.getMarketplaceStats();
  }

  @Get('stats/categories')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Category statistics' })
  getCategoryStats() {
    return this.marketplaceService.getCategoryStats();
  }

  @Patch('listings/:id/featured')
  @ApiOperation({ summary: 'Set listing as featured' })
  @ApiResponse({ status: 200, description: 'Listing featured status updated' })
  setFeatured(@Param('id') id: string, @Body('isFeatured') isFeatured: boolean) {
    return this.marketplaceService.setFeatured(id, isFeatured);
  }
}

