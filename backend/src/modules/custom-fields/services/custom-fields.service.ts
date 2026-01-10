import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CustomField, FieldType, EntityType } from '../entities/custom-field.entity';
import { CustomFieldValue } from '../entities/custom-field-value.entity';
import {
  CreateCustomFieldDto,
  CustomField as CustomFieldDto,
  SetCustomFieldValueDto,
  GetCustomFieldValuesDto,
  CustomFieldValue as CustomFieldValueDto,
} from '../dto/custom-fields.dto';

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(
    @InjectRepository(CustomField)
    private readonly fieldRepository: Repository<CustomField>,
    @InjectRepository(CustomFieldValue)
    private readonly valueRepository: Repository<CustomFieldValue>,
  ) {}

  /**
   * Create custom field
   */
  async createCustomField(
    dto: CreateCustomFieldDto,
    companyId: string,
  ): Promise<CustomFieldDto> {
    // Validate field key format
    if (!/^[a-z0-9_]+$/.test(dto.fieldKey)) {
      throw new BadRequestException(
        'Field key must contain only lowercase letters, numbers, and underscores',
      );
    }

    // Check if field key already exists for this entity type
    const existing = await this.fieldRepository.findOne({
      where: { companyId, entityType: dto.entityType, fieldKey: dto.fieldKey },
    });

    if (existing) {
      throw new BadRequestException(
        `Field key '${dto.fieldKey}' already exists for ${dto.entityType}`,
      );
    }

    // Validate options for SELECT/MULTI_SELECT
    if (
      (dto.fieldType === FieldType.SELECT || dto.fieldType === FieldType.MULTI_SELECT) &&
      (!dto.options || dto.options.length === 0)
    ) {
      throw new BadRequestException(
        'Options are required for SELECT and MULTI_SELECT field types',
      );
    }

    const field = this.fieldRepository.create({
      companyId,
      name: dto.name,
      fieldKey: dto.fieldKey,
      entityType: dto.entityType,
      fieldType: dto.fieldType,
      label: dto.label || dto.name,
      description: dto.description,
      isRequired: dto.isRequired || false,
      defaultValue: dto.defaultValue,
      options: dto.options || [],
      validationRules: dto.validationRules,
      displayOrder: dto.displayOrder || 0,
      isActive: dto.isActive !== false,
    });

    const saved = await this.fieldRepository.save(field);

    return this.mapToDto(saved);
  }

  /**
   * Get custom fields
   */
  async getCustomFields(
    companyId: string,
    entityType?: EntityType,
  ): Promise<CustomFieldDto[]> {
    const where: any = { companyId, isActive: true };
    if (entityType) {
      where.entityType = entityType;
    }

    const fields = await this.fieldRepository.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return fields.map((f) => this.mapToDto(f));
  }

  /**
   * Set custom field value
   */
  async setCustomFieldValue(
    dto: SetCustomFieldValueDto,
    companyId: string,
  ): Promise<CustomFieldValueDto> {
    // Get field definition
    const field = await this.fieldRepository.findOne({
      where: { companyId, fieldKey: dto.fieldKey, isActive: true },
    });

    if (!field) {
      throw new BadRequestException(`Custom field '${dto.fieldKey}' not found`);
    }

    // Validate value
    this.validateFieldValue(field, dto.value);

    // Get or create value
    let value = await this.valueRepository.findOne({
      where: { companyId, entityId: dto.entityId, fieldKey: dto.fieldKey },
    });

    if (value) {
      value.value = dto.value;
      await this.valueRepository.save(value);
    } else {
      value = this.valueRepository.create({
        companyId,
        entityId: dto.entityId,
        fieldKey: dto.fieldKey,
        value: dto.value,
      });
      await this.valueRepository.save(value);
    }

    return this.mapValueToDto(value);
  }

  /**
   * Get custom field values
   */
  async getCustomFieldValues(
    dto: GetCustomFieldValuesDto,
    companyId: string,
  ): Promise<CustomFieldValueDto[]> {
    const where: any = { companyId, entityId: dto.entityId };

    // If entity type provided, filter by fields of that type
    if (dto.entityType) {
      const fields = await this.fieldRepository.find({
        where: { companyId, entityType: dto.entityType, isActive: true },
      });
      const fieldKeys = fields.map((f) => f.fieldKey);
      if (fieldKeys.length > 0) {
        where.fieldKey = In(fieldKeys);
      } else {
        // No fields of this type, return empty
        return [];
      }
    }

    const values = await this.valueRepository.find({
      where,
    });

    return values.map((v) => this.mapValueToDto(v));
  }

  /**
   * Delete custom field
   */
  async deleteCustomField(fieldId: string, companyId: string): Promise<void> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId, companyId },
    });

    if (!field) {
      throw new BadRequestException(`Custom field ${fieldId} not found`);
    }

    // Delete all values for this field
    await this.valueRepository.delete({
      companyId,
      fieldKey: field.fieldKey,
    });

    // Delete field
    await this.fieldRepository.remove(field);
  }

  /**
   * Toggle custom field
   */
  async toggleCustomField(
    fieldId: string,
    isActive: boolean,
    companyId: string,
  ): Promise<void> {
    const field = await this.fieldRepository.findOne({
      where: { id: fieldId, companyId },
    });

    if (!field) {
      throw new BadRequestException(`Custom field ${fieldId} not found`);
    }

    field.isActive = isActive;
    await this.fieldRepository.save(field);
  }

  // Private helper methods

  private validateFieldValue(field: CustomField, value: any): void {
    if (field.isRequired && (value === null || value === undefined || value === '')) {
      throw new BadRequestException(`Field '${field.name}' is required`);
    }

    if (value === null || value === undefined || value === '') {
      return; // Optional fields can be empty
    }

    switch (field.fieldType) {
      case FieldType.NUMBER:
        if (typeof value !== 'number' && isNaN(Number(value))) {
          throw new BadRequestException(`Field '${field.name}' must be a number`);
        }
        break;

      case FieldType.BOOLEAN:
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          throw new BadRequestException(`Field '${field.name}' must be a boolean`);
        }
        break;

      case FieldType.DATE:
        if (isNaN(Date.parse(value))) {
          throw new BadRequestException(`Field '${field.name}' must be a valid date`);
        }
        break;

      case FieldType.EMAIL:
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          throw new BadRequestException(`Field '${field.name}' must be a valid email`);
        }
        break;

      case FieldType.SELECT:
        if (!field.options.includes(value)) {
          throw new BadRequestException(
            `Field '${field.name}' value must be one of: ${field.options.join(', ')}`,
          );
        }
        break;

      case FieldType.MULTI_SELECT:
        if (!Array.isArray(value)) {
          throw new BadRequestException(`Field '${field.name}' must be an array`);
        }
        const invalidOptions = value.filter((v) => !field.options.includes(v));
        if (invalidOptions.length > 0) {
          throw new BadRequestException(
            `Field '${field.name}' contains invalid options: ${invalidOptions.join(', ')}`,
          );
        }
        break;
    }

    // Apply custom validation rules
    if (field.validationRules) {
      if (field.validationRules.minLength && value.length < field.validationRules.minLength) {
        throw new BadRequestException(
          `Field '${field.name}' must be at least ${field.validationRules.minLength} characters`,
        );
      }

      if (field.validationRules.maxLength && value.length > field.validationRules.maxLength) {
        throw new BadRequestException(
          `Field '${field.name}' must be at most ${field.validationRules.maxLength} characters`,
        );
      }

      if (field.validationRules.min && Number(value) < field.validationRules.min) {
        throw new BadRequestException(
          `Field '${field.name}' must be at least ${field.validationRules.min}`,
        );
      }

      if (field.validationRules.max && Number(value) > field.validationRules.max) {
        throw new BadRequestException(
          `Field '${field.name}' must be at most ${field.validationRules.max}`,
        );
      }
    }
  }

  private mapToDto(field: CustomField): CustomFieldDto {
    return {
      id: field.id,
      name: field.name,
      fieldKey: field.fieldKey,
      entityType: field.entityType,
      fieldType: field.fieldType,
      label: field.label || field.name,
      isRequired: field.isRequired,
      defaultValue: field.defaultValue,
      options: field.options,
      displayOrder: field.displayOrder,
      isActive: field.isActive,
      createdAt: field.createdAt.toISOString(),
    };
  }

  private mapValueToDto(value: CustomFieldValue): CustomFieldValueDto {
    return {
      id: value.id,
      entityId: value.entityId,
      fieldKey: value.fieldKey,
      value: value.value,
      updatedAt: value.updatedAt.toISOString(),
    };
  }
}

