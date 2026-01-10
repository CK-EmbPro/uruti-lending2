import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ElasticsearchService } from './services/elasticsearch.service';
import {
  ElasticsearchIndexDto,
  ElasticsearchSearchDto,
  ElasticsearchBulkIndexDto,
} from './dto/elasticsearch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Elasticsearch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('elasticsearch')
export class ElasticsearchController {
  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  @Post('index')
  @ApiOperation({ summary: 'Index document' })
  @ApiResponse({ status: 201, description: 'Document indexed successfully' })
  indexDocument(@Body() indexDto: ElasticsearchIndexDto) {
    return this.elasticsearchService.indexDocument(indexDto);
  }

  @Post('bulk-index')
  @ApiOperation({ summary: 'Bulk index documents' })
  @ApiResponse({ status: 201, description: 'Documents indexed successfully' })
  bulkIndex(@Body() bulkDto: ElasticsearchBulkIndexDto) {
    return this.elasticsearchService.bulkIndex(bulkDto);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search documents' })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(@Body() searchDto: ElasticsearchSearchDto) {
    return this.elasticsearchService.search(searchDto);
  }

  @Delete('index/:indexName/document/:documentId')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  deleteDocument(
    @Param('indexName') indexName: string,
    @Param('documentId') documentId: string,
  ) {
    return this.elasticsearchService.deleteDocument(indexName, documentId);
  }

  @Post('index/:indexName')
  @ApiOperation({ summary: 'Create index' })
  @ApiResponse({ status: 201, description: 'Index created successfully' })
  createIndex(
    @Param('indexName') indexName: string,
    @Body('mappings') mappings?: Record<string, any>,
  ) {
    return this.elasticsearchService.createIndex(indexName, mappings);
  }

  @Delete('index/:indexName')
  @ApiOperation({ summary: 'Delete index' })
  @ApiResponse({ status: 200, description: 'Index deleted' })
  deleteIndex(@Param('indexName') indexName: string) {
    return this.elasticsearchService.deleteIndex(indexName);
  }

  @Get('index/:indexName/stats')
  @ApiOperation({ summary: 'Get index statistics' })
  @ApiResponse({ status: 200, description: 'Index statistics' })
  getIndexStats(@Param('indexName') indexName: string) {
    return this.elasticsearchService.getIndexStats(indexName);
  }
}

