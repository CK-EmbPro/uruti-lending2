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
import { LoanPartnerService } from './loan-partner.service';
import { CreateLoanPartnerDto } from './dto/create-loan-partner.dto';
import { UpdateLoanPartnerDto } from './dto/update-loan-partner.dto';

@ApiTags('loan-partners')
@ApiBearerAuth('JWT-auth')
@Controller('loan-partners')
export class LoanPartnerController {
  constructor(private readonly loanPartnerService: LoanPartnerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new loan partner',
    description: 'Creates a new co-lending partner with FLDG configuration',
  })
  @ApiBody({ type: CreateLoanPartnerDto })
  @ApiResponse({ status: 201, description: 'Loan partner created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createDto: CreateLoanPartnerDto) {
    return this.loanPartnerService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all loan partners',
    description: 'Retrieves a list of all loan partners',
  })
  @ApiResponse({ status: 200, description: 'List of loan partners retrieved successfully' })
  findAll() {
    return this.loanPartnerService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get loan partner by ID',
    description: 'Retrieves a specific loan partner by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Loan Partner UUID', type: String })
  @ApiResponse({ status: 200, description: 'Loan partner found' })
  @ApiResponse({ status: 404, description: 'Loan partner not found' })
  findOne(@Param('id') id: string) {
    return this.loanPartnerService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({
    summary: 'Get loan partner by code',
    description: 'Retrieves a specific loan partner by its code',
  })
  @ApiParam({ name: 'code', description: 'Loan Partner Code', type: String })
  @ApiResponse({ status: 200, description: 'Loan partner found' })
  @ApiResponse({ status: 404, description: 'Loan partner not found' })
  findByCode(@Param('code') code: string) {
    return this.loanPartnerService.findByCode(code);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update loan partner',
    description: 'Updates an existing loan partner',
  })
  @ApiParam({ name: 'id', description: 'Loan Partner UUID', type: String })
  @ApiBody({ type: UpdateLoanPartnerDto })
  @ApiResponse({ status: 200, description: 'Loan partner updated successfully' })
  @ApiResponse({ status: 404, description: 'Loan partner not found' })
  update(@Param('id') id: string, @Body() updateDto: UpdateLoanPartnerDto) {
    return this.loanPartnerService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete loan partner',
    description: 'Permanently deletes a loan partner',
  })
  @ApiParam({ name: 'id', description: 'Loan Partner UUID', type: String })
  @ApiResponse({ status: 204, description: 'Loan partner deleted successfully' })
  @ApiResponse({ status: 404, description: 'Loan partner not found' })
  remove(@Param('id') id: string) {
    return this.loanPartnerService.remove(id);
  }
}

