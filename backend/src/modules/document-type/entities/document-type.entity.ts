import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DocumentCategory {
  IDENTITY = 'Identity',
  ADDRESS = 'Address',
  INCOME = 'Income',
  EMPLOYMENT = 'Employment',
  BANK = 'Bank',
  PROPERTY = 'Property',
  OTHER = 'Other',
}

@Entity('document_types')
@Index(['code'], { unique: true })
export class DocumentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Unique code (e.g., PAN, AADHAAR, SALARY_SLIP)

  @Column()
  name: string; // Display name (e.g., PAN Card, Aadhaar Card)

  @Column({
    type: 'enum',
    enum: DocumentCategory,
  })
  category: DocumentCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean; // Whether this document is mandatory

  @Column({ type: 'boolean', default: false })
  hasExpiry: boolean; // Whether this document has expiry date

  @Column({ type: 'int', nullable: true })
  validityPeriodMonths: number; // Validity period in months

  @Column({ type: 'boolean', default: false })
  requiresVerification: boolean; // Whether this document requires verification

  @Column({ type: 'text', nullable: true })
  allowedFileTypes: string; // Comma-separated MIME types (e.g., "application/pdf,image/jpeg")

  @Column({ type: 'bigint', nullable: true })
  maxFileSize: number; // Maximum file size in bytes

  @Column({ type: 'int', default: 1 })
  maxDocuments: number; // Maximum number of documents of this type allowed

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

