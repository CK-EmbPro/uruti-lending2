import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from './services/search.service';
import { AdvancedSearchService } from './services/advanced-search.service';
import { SavedSearchService } from './services/saved-search.service';
import { SearchDto, SearchResponseDto } from './dto/search.dto';
import { CreateSavedSearchDto, UpdateSavedSearchDto } from './dto/saved-search.dto';
import { SearchEntityType } from '../../common/enums/search-entity-type.enum';

@ApiTags('search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly advancedSearchService: AdvancedSearchService,
    private readonly savedSearchService: SavedSearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Perform global search' })
  @ApiResponse({ status: 200, description: 'Search results', type: SearchResponseDto })
  async search(@Query() dto: SearchDto, @Request() req: any): Promise<SearchResponseDto> {
    return this.searchService.search(dto, req.user?.id);
  }

  @Get('advanced')
  @ApiOperation({ summary: 'Perform advanced search with enhanced filtering and relevance scoring' })
  @ApiResponse({ status: 200, description: 'Advanced search results', type: SearchResponseDto })
  async advancedSearch(@Query() dto: SearchDto, @Request() req: any): Promise<SearchResponseDto> {
    return this.advancedSearchService.advancedSearch(dto, req.user?.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export search results to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file', type: String })
  async exportSearch(@Query() dto: SearchDto, @Request() req: any): Promise<{ csv: string; filename: string }> {
    const csv = await this.advancedSearchService.exportSearchResults(dto, req.user?.id);
    const filename = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
    return { csv, filename };
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions from history' })
  @ApiResponse({ status: 200, description: 'Search suggestions', type: [String] })
  async getSuggestions(
    @Query('q') query: string,
    @Query('limit') limit: number = 10,
    @Request() req: any,
  ): Promise<string[]> {
    if (!req.user?.id) {
      return [];
    }
    return this.searchService.getSearchSuggestions(req.user.id, query, limit);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user search history' })
  @ApiResponse({ status: 200, description: 'Search history' })
  async getHistory(
    @Query('limit') limit: number = 20,
    @Request() req: any,
  ) {
    if (!req.user?.id) {
      return [];
    }
    return this.searchService.getSearchHistory(req.user.id, limit);
  }

  // Saved searches endpoints
  @Post('saved-searches')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a saved search' })
  @ApiResponse({ status: 201, description: 'Saved search created successfully' })
  async createSavedSearch(@Body() dto: CreateSavedSearchDto, @Request() req: any) {
    return this.savedSearchService.create(dto, req.user?.id);
  }

  @Get('saved-searches')
  @ApiOperation({ summary: 'Get all saved searches for user' })
  @ApiResponse({ status: 200, description: 'Saved searches retrieved successfully' })
  async getSavedSearches(
    @Request() req: any,
    @Query('type') entityType?: SearchEntityType,
  ) {
    if (!req.user?.id) {
      return [];
    }
    return this.savedSearchService.findAll(req.user.id, entityType);
  }

  @Get('saved-searches/:id')
  @ApiOperation({ summary: 'Get saved search by ID' })
  @ApiResponse({ status: 200, description: 'Saved search retrieved successfully' })
  async getSavedSearch(@Param('id') id: string, @Request() req: any) {
    return this.savedSearchService.findOne(id, req.user?.id);
  }

  @Put('saved-searches/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update saved search' })
  @ApiResponse({ status: 200, description: 'Saved search updated successfully' })
  async updateSavedSearch(
    @Param('id') id: string,
    @Body() dto: UpdateSavedSearchDto,
    @Request() req: any,
  ) {
    return this.savedSearchService.update(id, dto, req.user?.id);
  }

  @Delete('saved-searches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete saved search' })
  @ApiResponse({ status: 204, description: 'Saved search deleted successfully' })
  async deleteSavedSearch(@Param('id') id: string, @Request() req: any) {
    await this.savedSearchService.delete(id, req.user?.id);
  }

  @Post('saved-searches/:id/use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment use count for saved search' })
  @ApiResponse({ status: 200, description: 'Use count incremented' })
  async useSavedSearch(@Param('id') id: string) {
    return this.savedSearchService.incrementUseCount(id);
  }
}

