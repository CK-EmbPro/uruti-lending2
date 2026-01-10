import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DocumentCategory {
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  LOAN_DOCUMENT = 'LOAN_DOCUMENT',
  CUSTOMER_DOCUMENT = 'CUSTOMER_DOCUMENT',
  COMPLIANCE = 'COMPLIANCE',
  CONTRACT = 'CONTRACT',
  STATEMENT = 'STATEMENT',
  OTHER = 'OTHER',
}

export enum DocumentAccessLevel {
  PRIVATE = 'PRIVATE',
  INTERNAL = 'INTERNAL',
  SHARED = 'SHARED',
  PUBLIC = 'PUBLIC',
}

@Entity('document_metadata')
@Index(['companyId'])
@Index(['category'])
@Index(['accessLevel'])
@Index(['createdAt'])
export class DocumentMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  documentId: string; // Reference to actual document (LoanApplicationDocument, LoanDocument, etc.)

  @Column()
  documentType: string; // Type of document entity (loan_application_document, loan_document, etc.)

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DocumentCategory,
  })
  category: DocumentCategory;

  @Column()
  fileType: string; // MIME type

  @Column({ type: 'bigint' })
  fileSize: number; // Bytes

  @Column({ type: 'json', default: [] })
  tags: string[];

  @Column({
    type: 'enum',
    enum: DocumentAccessLevel,
    default: DocumentAccessLevel.PRIVATE,
  })
  accessLevel: DocumentAccessLevel;

  @Column({ type: 'json', default: [] })
  versions: Array<{
    version: number;
    filePath: string;
    fileSize: number;
    createdAt: string;
    createdBy: string;
    changeDescription: string;
  }>;

  @Column({ type: 'json', default: [] })
  sharedWith: Array<{
    userId: string;
    accessLevel: DocumentAccessLevel;
    expiryDate?: string;
    canDownload: boolean;
    sharedAt: string;
  }>;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

