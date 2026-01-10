import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  TEXTAREA = 'TEXTAREA',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  URL = 'URL',
  CURRENCY = 'CURRENCY',
}

export enum EntityType {
  CUSTOMER = 'CUSTOMER',
  LOAN = 'LOAN',
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  LOAN_REPAYMENT = 'LOAN_REPAYMENT',
  DOCUMENT = 'DOCUMENT',
}

@Entity('custom_fields')
@Index(['companyId', 'entityType', 'fieldKey'], { unique: true })
@Index(['companyId'])
@Index(['entityType'])
@Index(['isActive'])
export class CustomField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column()
  fieldKey: string; // Unique identifier (e.g., 'preferred_contact_method')

  @Column({
    type: 'enum',
    enum: EntityType,
  })
  entityType: EntityType;

  @Column({
    type: 'enum',
    enum: FieldType,
  })
  fieldType: FieldType;

  @Column({ nullable: true })
  label: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'json', nullable: true })
  defaultValue: any;

  @Column({ type: 'json', default: [] })
  options: string[]; // For SELECT/MULTI_SELECT

  @Column({ type: 'json', nullable: true })
  validationRules: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

