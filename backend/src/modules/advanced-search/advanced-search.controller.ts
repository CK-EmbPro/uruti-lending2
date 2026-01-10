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
import { AdvancedSearchService } from './services/advanced-search.service';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('advanced-search')
@ApiBearerAuth('JWT-auth')
@Controller('advanced-search')
@UseGuards(CompanyGuard)
export class AdvancedSearchController {
  constructor(private readonly searchService: AdvancedSearchService) {}

  @Post('search')
  @ApiOperation({
    summary: 'Perform advanced search',
    description: 'Performs advanced search across multiple entity types with relevance scoring, filtering, sorting, and pagination. Supports saved searches.',
  })
  @ApiBody({ type: AdvancedSearchDto })
  @ApiResponse({
    status: 200,
    description: 'Search completed successfully',
  })
  async search(
    @Body() dto: AdvancedSearchDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const result = await this.searchService.search(dto, companyId);

    // Save search if requested
    if (dto.saveSearch && dto.searchName) {
      const userId = req.user?.id || 'system';
      const savedSearch = await this.searchService.saveSearch(dto, companyId, userId);
      result.searchId = savedSearch.id;
    }

    return result;
  }
}

