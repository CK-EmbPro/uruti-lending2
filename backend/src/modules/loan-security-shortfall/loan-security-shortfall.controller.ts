import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoanSecurityShortfallService } from './loan-security-shortfall.service';

@ApiTags('loan-security-shortfalls')
@ApiBearerAuth('JWT-auth')
@Controller('loan-security-shortfalls')
export class LoanSecurityShortfallController {
  constructor(
    private readonly shortfallService: LoanSecurityShortfallService,
  ) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check for LTV shortfall',
    description: 'Checks all secured loans for loan-to-value ratio shortfall and creates/resolves shortfall records',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        processLoanSecurityShortfall: {
          type: 'string',
          description: 'Optional reference to process document',
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Shortfall check completed',
    schema: {
      type: 'object',
      properties: {
        checked: { type: 'number', example: 10 },
        shortfallsCreated: { type: 'number', example: 2 },
        shortfallsResolved: { type: 'number', example: 1 },
      },
    },
  })
  async checkForShortfall(
    @Body() body?: { processLoanSecurityShortfall?: string },
  ) {
    return this.shortfallService.checkForLtvShortfall(
      body?.processLoanSecurityShortfall,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all shortfalls',
    description: 'Retrieves all security shortfall records, optionally filtered by loan ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Shortfalls retrieved successfully',
  })
  async findAll(@Param('loanId') loanId?: string) {
    return this.shortfallService.findAll(loanId);
  }

  @Get('loan/:loanId')
  @ApiOperation({
    summary: 'Get shortfalls for a loan',
    description: 'Retrieves all shortfall records for a specific loan',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Shortfalls retrieved successfully',
  })
  async findByLoanId(@Param('loanId') loanId: string) {
    return this.shortfallService.findAll(loanId);
  }

  @Get('loan/:loanId/pending')
  @ApiOperation({
    summary: 'Check if loan has pending shortfall',
    description: 'Checks if a loan has any pending shortfall records',
  })
  @ApiParam({ name: 'loanId', description: 'Loan UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Pending shortfall status',
    schema: {
      type: 'object',
      properties: {
        hasPendingShortfall: { type: 'boolean', example: true },
        shortfall: {
          type: 'object',
          nullable: true,
        },
      },
    },
  })
  async checkPendingShortfall(@Param('loanId') loanId: string) {
    const shortfall = await this.shortfallService.findPendingShortfallByLoanId(
      loanId,
    );
    return {
      hasPendingShortfall: shortfall !== null,
      shortfall,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get shortfall by ID',
    description: 'Retrieves a specific shortfall record by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Shortfall UUID', type: String })
  @ApiResponse({ status: 200, description: 'Shortfall found' })
  @ApiResponse({ status: 404, description: 'Shortfall not found' })
  async findOne(@Param('id') id: string) {
    return this.shortfallService.findOne(id);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve shortfall',
    description: 'Marks a shortfall as resolved',
  })
  @ApiParam({ name: 'id', description: 'Shortfall UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Shortfall resolved successfully',
  })
  @ApiResponse({ status: 404, description: 'Shortfall not found' })
  async resolveShortfall(@Param('id') id: string) {
    return this.shortfallService.resolveShortfall(id);
  }
}

