import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('custom_field_values')
@Index(['companyId', 'entityId', 'fieldKey'], { unique: true })
@Index(['companyId'])
@Index(['entityId'])
@Index(['fieldKey'])
export class CustomFieldValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  entityId: string; // ID of the entity (customer, loan, etc.)

  @Column()
  fieldKey: string; // Reference to CustomField.fieldKey

  @Column({ type: 'json' })
  value: any; // Flexible value storage

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

