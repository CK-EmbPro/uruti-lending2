import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CustomFieldsService } from './services/custom-fields.service';
import {
  CreateCustomFieldDto,
  SetCustomFieldValueDto,
  GetCustomFieldValuesDto,
} from './dto/custom-fields.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('custom-fields')
@ApiBearerAuth('JWT-auth')
@Controller('custom-fields')
@UseGuards(CompanyGuard)
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Post('fields')
  @ApiOperation({
    summary: 'Create custom field',
    description: 'Creates a new custom field for an entity type. Supports multiple field types (text, number, date, boolean, select, etc.) with validation rules.',
  })
  @ApiBody({ type: CreateCustomFieldDto })
  @ApiResponse({
    status: 201,
    description: 'Custom field created successfully',
  })
  async createCustomField(
    @Body() dto: CreateCustomFieldDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.customFieldsService.createCustomField(dto, companyId);
  }

  @Get('fields')
  @ApiOperation({
    summary: 'Get custom fields',
    description: 'Returns list of custom fields, optionally filtered by entity type.',
  })
  @ApiQuery({ name: 'entityType', required: false, enum: ['CUSTOMER', 'LOAN', 'LOAN_APPLICATION', 'LOAN_REPAYMENT', 'DOCUMENT'] })
  @ApiResponse({
    status: 200,
    description: 'Custom fields retrieved successfully',
  })
  async getCustomFields(
    @Query('entityType') entityType: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.customFieldsService.getCustomFields(companyId, entityType as any);
  }

  @Post('values')
  @ApiOperation({
    summary: 'Set custom field value',
    description: 'Sets the value of a custom field for an entity. Validates the value based on field type and validation rules.',
  })
  @ApiBody({ type: SetCustomFieldValueDto })
  @ApiResponse({
    status: 200,
    description: 'Custom field value set successfully',
  })
  async setCustomFieldValue(
    @Body() dto: SetCustomFieldValueDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.customFieldsService.setCustomFieldValue(dto, companyId);
  }

  @Post('values/get')
  @ApiOperation({
    summary: 'Get custom field values',
    description: 'Returns all custom field values for an entity, optionally filtered by entity type.',
  })
  @ApiBody({ type: GetCustomFieldValuesDto })
  @ApiResponse({
    status: 200,
    description: 'Custom field values retrieved successfully',
  })
  async getCustomFieldValues(
    @Body() dto: GetCustomFieldValuesDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.customFieldsService.getCustomFieldValues(dto, companyId);
  }

  @Delete('fields/:id')
  @ApiOperation({
    summary: 'Delete custom field',
    description: 'Deletes a custom field and all its associated values.',
  })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Custom field deleted successfully',
  })
  async deleteCustomField(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.customFieldsService.deleteCustomField(id, companyId);
    return { message: 'Custom field deleted successfully' };
  }

  @Patch('fields/:id/toggle')
  @ApiOperation({
    summary: 'Toggle custom field',
    description: 'Activates or deactivates a custom field.',
  })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isActive: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Custom field status updated successfully',
  })
  async toggleCustomField(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    await this.customFieldsService.toggleCustomField(id, body.isActive, companyId);
    return { message: 'Custom field status updated successfully' };
  }
}

