import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { LoanSecurityPriceService } from './loan-security-price.service';
import { CreateLoanSecurityPriceDto } from './dto/create-loan-security-price.dto';

@ApiTags('loan-security-prices')
@ApiBearerAuth('JWT-auth')
@Controller('loan-security-prices')
export class LoanSecurityPriceController {
  constructor(private readonly priceService: LoanSecurityPriceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create security price entry',
    description: 'Creates a new price entry for a security with validity period',
  })
  @ApiBody({ type: CreateLoanSecurityPriceDto })
  @ApiResponse({
    status: 201,
    description: 'Price entry created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or overlapping dates' })
  create(@Body() createDto: CreateLoanSecurityPriceDto) {
    return this.priceService.create(createDto);
  }

  @Get('security/:securityId/current')
  @ApiOperation({
    summary: 'Get current price for security',
    description: 'Retrieves the current valid price for a security',
  })
  @ApiParam({ name: 'securityId', description: 'Security UUID', type: String })
  @ApiQuery({
    name: 'validTime',
    required: false,
    description: 'Optional time to check (ISO 8601), defaults to now',
  })
  @ApiResponse({
    status: 200,
    description: 'Current price retrieved',
    schema: {
      type: 'object',
      properties: {
        price: { type: 'number', example: 1000 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No valid price found' })
  getCurrentPrice(
    @Param('securityId') securityId: string,
    @Query('validTime') validTime?: string,
  ) {
    const checkTime = validTime ? new Date(validTime) : undefined;
    return this.priceService.getCurrentPrice(securityId, checkTime);
  }

  @Get('security/:securityId')
  @ApiOperation({
    summary: 'Get all prices for security',
    description: 'Retrieves all price entries for a security',
  })
  @ApiParam({ name: 'securityId', description: 'Security UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Price history retrieved successfully',
  })
  findAll(@Param('securityId') securityId: string) {
    return this.priceService.findAll(securityId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get price entry by ID',
    description: 'Retrieves a specific price entry by its unique identifier',
  })
  @ApiParam({ name: 'id', description: 'Price entry UUID', type: String })
  @ApiResponse({ status: 200, description: 'Price entry found' })
  @ApiResponse({ status: 404, description: 'Price entry not found' })
  findOne(@Param('id') id: string) {
    return this.priceService.findOne(id);
  }

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update price entry',
    description: 'Updates an existing price entry',
  })
  @ApiParam({ name: 'id', description: 'Price entry UUID', type: String })
  @ApiBody({ type: CreateLoanSecurityPriceDto })
  @ApiResponse({
    status: 200,
    description: 'Price entry updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or overlapping dates' })
  @ApiResponse({ status: 404, description: 'Price entry not found' })
  update(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateLoanSecurityPriceDto>,
  ) {
    return this.priceService.update(id, updateDto);
  }

  @Post(':id/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete price entry',
    description: 'Deletes a price entry',
  })
  @ApiParam({ name: 'id', description: 'Price entry UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Price entry deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Price entry not found' })
  async remove(@Param('id') id: string) {
    await this.priceService.remove(id);
  }
}

