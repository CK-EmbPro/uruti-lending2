import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('ai_document_processings')
@Index(['documentId'])
@Index(['applicationId'])
@Index(['status'])
@Index(['createdAt'])
export class AIDocumentProcessing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string; // Reference to loan_application_documents

  @Column({ nullable: true })
  applicationId: string; // Reference to loan_applications (if processing for application)

  @Column()
  documentType: string; // ID_CARD, BANK_STATEMENT, etc.

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({
    type: 'varchar',
    length: '50',
    default: 'Pending',
  })
  status: string; // 'Pending', 'Processing', 'Completed', 'Failed'

  // Extracted data stored as JSONB
  @Column({ type: 'jsonb', nullable: true })
  extractedData: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  rawText: string; // First 5000 chars of extracted text

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  confidence: number; // 0-1 confidence score

  @Column({ type: 'jsonb', nullable: true })
  validationErrors: string[];

  @Column({ type: 'jsonb', nullable: true })
  suggestions: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  processingTime: number; // milliseconds

  @Column({ nullable: true })
  aiModel: string; // Which AI provider/model was used

  @Column({ nullable: true })
  aiProvider: string; // 'openai', 'google', 'aws', etc.

  @Column({ type: 'boolean', default: false })
  autoFilled: boolean; // Whether data was auto-filled to application

  @Column({ type: 'jsonb', nullable: true })
  filledFields: string[]; // List of fields that were auto-filled

  @Column({ type: 'text', nullable: true })
  errorMessage: string; // Error message if processing failed

  @Column({ nullable: true })
  processedBy: string; // User ID who triggered processing

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

