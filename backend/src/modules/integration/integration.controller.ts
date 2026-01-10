import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiHeader,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { IntegrationService } from './services/integration.service';
import { CreateExternalLoanApplicationDto } from './dto/create-external-loan-application.dto';
import { PostExternalRepaymentDto } from './dto/post-external-repayment.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('Integration')
@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create loan application from external platform',
    description: 'Allows third-party platforms to create loan applications. Requires API key authentication.',
  })
  @ApiHeader({ name: 'X-API-Key', description: 'Platform API key', required: true })
  @ApiBody({ type: CreateExternalLoanApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Loan application created successfully',
    schema: {
      example: {
        id: 'uuid',
        externalReferenceId: 'TRIP-12345',
        status: 'Pending',
        loanApplicationId: 'uuid',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Platform not authorized to create applications' })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  @UseGuards(ApiKeyGuard)
  async createExternalApplication(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: CreateExternalLoanApplicationDto,
  ) {
    try {
      const platform = await this.integrationService.authenticatePlatform(apiKey);
      return await this.integrationService.createExternalLoanApplication(platform.id, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { message: 'Failed to create application', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('repayments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Post repayment from external platform',
    description: 'Allows third-party platforms to post loan repayments. Requires API key authentication.',
  })
  @ApiHeader({ name: 'X-API-Key', description: 'Platform API key', required: true })
  @ApiBody({ type: PostExternalRepaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Repayment posted successfully',
    schema: {
      example: {
        id: 'uuid',
        externalReferenceId: 'PAYMENT-12345',
        status: 'Processed',
        amount: 55000,
        createdAt: '2024-01-25T10:30:00Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data or duplicate payment' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 403, description: 'Platform not authorized to post repayments' })
  @ApiResponse({ status: 404, description: 'Loan not found' })
  @UseGuards(ApiKeyGuard)
  async postExternalRepayment(
    @Headers('x-api-key') apiKey: string,
    @Body() dto: PostExternalRepaymentDto,
  ) {
    try {
      const platform = await this.integrationService.authenticatePlatform(apiKey);
      return await this.integrationService.postExternalRepayment(platform.id, dto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        { message: 'Failed to post repayment', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('loans/:loanReference/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get loan status',
    description: 'Allows third-party platforms to query loan status by loan number or external reference. Requires API key authentication.',
  })
  @ApiHeader({ name: 'X-API-Key', description: 'Platform API key' })
  @UseGuards(ApiKeyGuard)
  async getLoanStatus(
    @Headers('x-api-key') apiKey: string,
    @Param('loanReference') loanReference: string,
  ) {
    const platform = await this.integrationService.authenticatePlatform(apiKey);
    return this.integrationService.getLoanStatus(platform.id, loanReference);
  }

  @Get('applications/:externalReferenceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get external application status',
    description: 'Allows third-party platforms to query application status by external reference ID. Requires API key authentication.',
  })
  @ApiHeader({ name: 'X-API-Key', description: 'Platform API key' })
  @UseGuards(ApiKeyGuard)
  async getExternalApplicationStatus(
    @Headers('x-api-key') apiKey: string,
    @Param('externalReferenceId') externalReferenceId: string,
  ) {
    const platform = await this.integrationService.authenticatePlatform(apiKey);
    return this.integrationService.getExternalApplicationStatus(platform.id, externalReferenceId);
  }
}

