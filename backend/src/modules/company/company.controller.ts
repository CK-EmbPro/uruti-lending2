import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('company')
@ApiBearerAuth('JWT-auth')
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new company', description: 'Creates a new company record' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Company code already exists' })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all companies', description: 'Retrieves a list of all companies. Public endpoint - no authentication required.' })
  @ApiResponse({ status: 200, description: 'List of companies retrieved successfully' })
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get company by ID', description: 'Retrieves a specific company by its unique identifier. Public endpoint - no authentication required.' })
  @ApiParam({ name: 'id', description: 'Company UUID', type: String })
  @ApiResponse({ status: 200, description: 'Company found' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company', description: 'Updates an existing company record' })
  @ApiParam({ name: 'id', description: 'Company UUID', type: String })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companyService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company', description: 'Permanently deletes a company record' })
  @ApiParam({ name: 'id', description: 'Company UUID', type: String })
  @ApiResponse({ status: 204, description: 'Company deleted successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiResponse({ status: 400, description: 'Company cannot be deleted (has associated loans)' })
  remove(@Param('id') id: string) {
    return this.companyService.remove(id);
  }
}

