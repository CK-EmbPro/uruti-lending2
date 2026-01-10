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
import { LoanRefundService } from './loan-refund.service';
import { CreateLoanRefundDto } from './dto/create-loan-refund.dto';
import { UpdateLoanRefundDto } from './dto/update-loan-refund.dto';

@ApiTags('loan-refunds')
@ApiBearerAuth('JWT-auth')
@Controller('loan-refunds')
export class LoanRefundController {
  constructor(private readonly loanRefundService: LoanRefundService) {}

  @Post()
  @ApiOperation({
    summary: 'Create loan refund',
    description:
      'Creates a refund entry for a loan. Supports excess amount refund, security amount refund, or regular refund.',
  })
  @ApiBody({ type: CreateLoanRefundDto })
  @ApiResponse({
    status: 201,
    description: 'Refund created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid refund amount',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  create(@Body() createLoanRefundDto: CreateLoanRefundDto) {
    return this.loanRefundService.create(createLoanRefundDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all refunds',
    description: 'Retrieves all refund entries. Optionally filter by loanId query parameter.',
  })
  @ApiResponse({ status: 200, description: 'List of refunds' })
  findAll(@Query('loanId') loanId?: string) {
    return this.loanRefundService.findAll(loanId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get refund by ID',
    description: 'Retrieves a specific refund entry by ID',
  })
  @ApiParam({ name: 'id', description: 'Refund UUID', type: String })
  @ApiResponse({ status: 200, description: 'Refund details' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  findOne(@Param('id') id: string) {
    return this.loanRefundService.findOne(id);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get refunds by loan ID',
    description: 'Retrieves all refund entries for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({ status: 200, description: 'List of refunds for the loan' })
  findByLoanId(@Param('loanId') loanId: string) {
    return this.loanRefundService.findByLoanId(loanId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update refund',
    description:
      'Updates a refund entry. Only limited fields can be updated (e.g., cost center, reference number).',
  })
  @ApiParam({ name: 'id', description: 'Refund UUID', type: String })
  @ApiBody({ type: UpdateLoanRefundDto })
  @ApiResponse({ status: 200, description: 'Refund updated successfully' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  update(
    @Param('id') id: string,
    @Body() updateLoanRefundDto: UpdateLoanRefundDto,
  ) {
    return this.loanRefundService.update(id, updateLoanRefundDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete refund',
    description:
      'Deletes a refund entry. This will recalculate loan refund amounts.',
  })
  @ApiParam({ name: 'id', description: 'Refund UUID', type: String })
  @ApiResponse({ status: 200, description: 'Refund deleted successfully' })
  @ApiResponse({ status: 404, description: 'Refund not found' })
  remove(@Param('id') id: string) {
    return this.loanRefundService.remove(id);
  }

  @Post('make-refund-jv')
  @ApiOperation({
    summary: 'Make refund journal entry (convenience method)',
    description:
      'Convenience method to create a refund entry. Matches Frappe API signature. Auto-calculates excess amount if not provided.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        loanId: { type: 'string', description: 'Loan UUID' },
        amount: {
          type: 'number',
          description: 'Refund amount (optional, auto-calculated from excess amount)',
        },
        referenceNumber: {
          type: 'string',
          description: 'Reference number (optional)',
        },
        referenceDate: {
          type: 'string',
          format: 'date',
          description: 'Reference date (optional)',
        },
      },
      required: ['loanId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Refund created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'No excess amount pending for refund',
  })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  makeRefundJv(
    @Body()
    body: {
      loanId: string;
      amount?: number;
      referenceNumber?: string;
      referenceDate?: string;
    },
  ) {
    return this.loanRefundService.makeRefundJv(
      body.loanId,
      body.amount,
      body.referenceNumber,
      body.referenceDate ? new Date(body.referenceDate) : undefined,
    );
  }
}

