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
import { APIDocumentationService } from './services/api-documentation.service';
import {
  CreateAPIDocumentationDto,
  TestAPIDto,
  DocumentationStatus,
} from './dto/api-documentation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('API Documentation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-documentation')
export class APIDocumentationController {
  constructor(private readonly documentationService: APIDocumentationService) {}

  @Post('documentation')
  @ApiOperation({ summary: 'Create API documentation' })
  @ApiResponse({ status: 201, description: 'Documentation created successfully' })
  createDocumentation(@Body() createDto: CreateAPIDocumentationDto) {
    return this.documentationService.createDocumentation(createDto);
  }

  @Get('documentation')
  @ApiOperation({ summary: 'Get all API documentation' })
  @ApiResponse({ status: 200, description: 'List of API documentation' })
  findAllDocumentation(@Query('status') status?: DocumentationStatus) {
    return this.documentationService.findAllDocumentation(status);
  }

  @Get('documentation/:id')
  @ApiOperation({ summary: 'Get API documentation by ID' })
  @ApiResponse({ status: 200, description: 'API documentation details' })
  findOneDocumentation(@Param('id') id: string) {
    return this.documentationService.findOneDocumentation(id);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test API endpoint' })
  @ApiResponse({ status: 200, description: 'API test result' })
  testAPI(@Body() testDto: TestAPIDto) {
    return this.documentationService.testAPI(testDto);
  }

  @Get('openapi-spec')
  @ApiOperation({ summary: 'Generate OpenAPI specification' })
  @ApiResponse({ status: 200, description: 'OpenAPI specification' })
  generateOpenAPISpec() {
    return this.documentationService.generateOpenAPISpec();
  }
}

