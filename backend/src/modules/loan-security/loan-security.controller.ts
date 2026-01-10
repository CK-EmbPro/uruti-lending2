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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LoanSecurityService } from './loan-security.service';
import { CreateLoanSecurityDto } from './dto/create-loan-security.dto';
import { UpdateLoanSecurityDto } from './dto/update-loan-security.dto';

@ApiTags('loan-security')
@ApiBearerAuth('JWT-auth')
@Controller('loan-securities')
export class LoanSecurityController {
  constructor(private readonly loanSecurityService: LoanSecurityService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create loan security', description: 'Creates a new security/collateral record for a loan' })
  @ApiBody({ type: CreateLoanSecurityDto })
  @ApiResponse({ status: 201, description: 'Security created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createDto: CreateLoanSecurityDto) {
    return this.loanSecurityService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all loan securities', description: 'Retrieves a list of all loan securities' })
  @ApiQuery({ name: 'loanId', required: false, description: 'Filter by loan ID' })
  @ApiResponse({ status: 200, description: 'List of securities retrieved successfully' })
  findAll(@Query('loanId') loanId?: string) {
    return this.loanSecurityService.findAll(loanId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get loan security by ID', description: 'Retrieves a specific loan security by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Security UUID', type: String })
  @ApiResponse({ status: 200, description: 'Security found' })
  @ApiResponse({ status: 404, description: 'Security not found' })
  findOne(@Param('id') id: string) {
    return this.loanSecurityService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({ summary: 'Get securities by loan ID', description: 'Retrieves all securities for a specific loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'Securities found' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanSecurityService.findByLoanId(loanId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update loan security', description: 'Updates an existing loan security record' })
  @ApiParam({ name: 'id', description: 'Security UUID', type: String })
  @ApiBody({ type: UpdateLoanSecurityDto })
  @ApiResponse({ status: 200, description: 'Security updated successfully' })
  @ApiResponse({ status: 404, description: 'Security not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateLoanSecurityDto) {
    return this.loanSecurityService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete loan security', description: 'Permanently deletes a loan security record' })
  @ApiParam({ name: 'id', description: 'Security UUID', type: String })
  @ApiResponse({ status: 204, description: 'Security deleted successfully' })
  @ApiResponse({ status: 404, description: 'Security not found' })
  remove(@Param('id') id: string) {
    return this.loanSecurityService.remove(id);
  }
}

