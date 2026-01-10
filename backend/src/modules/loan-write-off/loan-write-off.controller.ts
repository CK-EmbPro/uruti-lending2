import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LoanWriteOffService } from './loan-write-off.service';
import { CreateLoanWriteOffDto } from './dto/create-loan-write-off.dto';
import { UpdateLoanWriteOffDto } from './dto/update-loan-write-off.dto';

@ApiTags('loan-write-offs')
@ApiBearerAuth('JWT-auth')
@Controller('loan-write-offs')
export class LoanWriteOffController {
  constructor(private readonly loanWriteOffService: LoanWriteOffService) {}

  @Post()
  @ApiOperation({
    summary: 'Create loan write-off',
    description:
      'Creates a write-off entry for a loan. Write-off amount must equal pending principal amount (unless settlement write-off).',
  })
  @ApiBody({ type: CreateLoanWriteOffDto })
  @ApiResponse({
    status: 201,
    description: 'Write-off created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid write-off amount or loan status',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createLoanWriteOffDto: CreateLoanWriteOffDto) {
    return this.loanWriteOffService.create(createLoanWriteOffDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all write-offs',
    description: 'Retrieves all write-off entries. Optionally filter by loanId query parameter.',
  })
  @ApiResponse({ status: 200, description: 'List of write-offs' })
  findAll(@Query('loanId') loanId?: string) {
    return this.loanWriteOffService.findAll(loanId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get write-off by ID',
    description: 'Retrieves a specific write-off entry by ID',
  })
  @ApiParam({ name: 'id', description: 'Write-off UUID', type: String })
  @ApiResponse({ status: 200, description: 'Write-off details' })
  @ApiResponse({ status: 404, description: 'Write-off not found' })
  findOne(@Param('id') id: string) {
    return this.loanWriteOffService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get write-offs by loan ID',
    description: 'Retrieves all write-off entries for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'List of write-offs for the loan' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanWriteOffService.findByLoanId(loanId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update write-off',
    description:
      'Updates a write-off entry. Only limited fields can be updated (e.g., cost center).',
  })
  @ApiParam({ name: 'id', description: 'Write-off UUID', type: String })
  @ApiBody({ type: UpdateLoanWriteOffDto })
  @ApiResponse({ status: 200, description: 'Write-off updated successfully' })
  @ApiResponse({ status: 404, description: 'Write-off not found' })
  update(
    @Param('id') id: string,
    @Body() updateLoanWriteOffDto: UpdateLoanWriteOffDto,
  ) {
    return this.loanWriteOffService.update(id, updateLoanWriteOffDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete write-off',
    description:
      'Deletes a write-off entry. This will recalculate loan written-off amount and may revert loan status.',
  })
  @ApiParam({ name: 'id', description: 'Write-off UUID', type: String })
  @ApiResponse({ status: 200, description: 'Write-off deleted successfully' })
  @ApiResponse({ status: 404, description: 'Write-off not found' })
  remove(@Param('id') id: string) {
    return this.loanWriteOffService.remove(id);
  }

  @Post('make-write-off')
  @ApiOperation({
    summary: 'Make loan write-off (convenience method)',
    description:
      'Convenience method to create a write-off entry. Matches Frappe API signature.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loanId: { type: 'string', description: 'Loan UUID' },
        companyId: { type: 'string', description: 'Company UUID (optional)' },
        postingDate: { type: 'string', format: 'date', description: 'Posting date (optional)' },
        amount: { type: 'number', description: 'Write-off amount (optional, auto-calculated)' },
      },
      required: ['loanId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Write-off created successfully',
  })
  makeLoanWriteOff(
    @Body()
    body: {
      loanId: string;
      companyId?: string;
      postingDate?: string;
      amount?: number;
    },
  ) {
    return this.loanWriteOffService.makeLoanWriteOff(
      body.loanId,
      body.companyId,
      body.postingDate ? new Date(body.postingDate) : undefined,
      body.amount,
    );
  }
}

