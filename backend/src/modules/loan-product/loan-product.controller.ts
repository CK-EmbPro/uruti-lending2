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
import { LoanProductService } from './loan-product.service';
import { CreateLoanProductDto } from './dto/create-loan-product.dto';
import { UpdateLoanProductDto } from './dto/update-loan-product.dto';
import { CreateLoanChargeDto } from './dto/create-loan-charge.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('loan-products')
@ApiBearerAuth('JWT-auth')
@Controller('loan-products')
export class LoanProductController {
  constructor(private readonly loanProductService: LoanProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new loan product', description: 'Creates a new loan product template with configuration' })
  @ApiBody({ type: CreateLoanProductDto })
  @ApiResponse({ status: 201, description: 'Loan product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Product code or name already exists' })
  create(@Body() createLoanProductDto: CreateLoanProductDto) {
    return this.loanProductService.create(createLoanProductDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all loan products', description: 'Retrieves a list of all loan products. Public endpoint - no authentication required.' })
  @ApiResponse({ status: 200, description: 'List of loan products retrieved successfully' })
  findAll() {
    return this.loanProductService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get loan product by ID', description: 'Retrieves a specific loan product by its unique identifier. Public endpoint - no authentication required.' })
  @ApiParam({ name: 'id', description: 'Loan product UUID', type: String })
  @ApiResponse({ status: 200, description: 'Loan product found' })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  findOne(@Param('id') id: string) {
    return this.loanProductService.findOne(id);
  }

  @Get('code/:productCode')
  @ApiOperation({ summary: 'Get loan product by code', description: 'Retrieves a loan product by its unique product code' })
  @ApiParam({ name: 'productCode', description: 'Unique product code', type: String })
  @ApiResponse({ status: 200, description: 'Loan product found' })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  findByProductCode(@Param('productCode') productCode: string) {
    return this.loanProductService.findByProductCode(productCode);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update loan product', description: 'Updates an existing loan product configuration' })
  @ApiParam({ name: 'id', description: 'Loan product UUID', type: String })
  @ApiBody({ type: UpdateLoanProductDto })
  @ApiResponse({ status: 200, description: 'Loan product updated successfully' })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  update(
    @Param('id') id: string,
    @Body() updateLoanProductDto: UpdateLoanProductDto,
  ) {
    return this.loanProductService.update(id, updateLoanProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete loan product', description: 'Permanently deletes a loan product (only if not in use)' })
  @ApiParam({ name: 'id', description: 'Loan product UUID', type: String })
  @ApiResponse({ status: 204, description: 'Loan product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  @ApiResponse({ status: 400, description: 'Loan product cannot be deleted (in use)' })
  remove(@Param('id') id: string) {
    return this.loanProductService.remove(id);
  }

  @Post(':id/charges')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add charge to loan product',
    description: 'Adds a new charge configuration to a loan product',
  })
  @ApiParam({ name: 'id', description: 'Loan product UUID', type: String })
  @ApiBody({ type: CreateLoanChargeDto })
  @ApiResponse({
    status: 201,
    description: 'Charge added successfully',
  })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  @ApiResponse({ status: 400, description: 'Invalid charge configuration' })
  addCharge(
    @Param('id') id: string,
    @Body() createChargeDto: CreateLoanChargeDto,
  ) {
    return this.loanProductService.addCharge(id, createChargeDto);
  }

  @Get(':id/charges')
  @ApiOperation({
    summary: 'Get all charges for loan product',
    description: 'Retrieves all charge configurations for a loan product',
  })
  @ApiParam({ name: 'id', description: 'Loan product UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of charges retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Loan product not found' })
  getCharges(@Param('id') id: string) {
    return this.loanProductService.getCharges(id);
  }

  @Delete('charges/:chargeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove charge from loan product',
    description: 'Removes a charge configuration from a loan product',
  })
  @ApiParam({ name: 'chargeId', description: 'Charge UUID', type: String })
  @ApiResponse({
    status: 204,
    description: 'Charge removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Charge not found' })
  removeCharge(@Param('chargeId') chargeId: string) {
    return this.loanProductService.removeCharge(chargeId);
  }
}

