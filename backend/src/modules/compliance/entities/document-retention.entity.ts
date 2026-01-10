import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LoanApplicationDocument } from '../../loan-application-document/entities/loan-application-document.entity';

export enum RetentionCategory {
  LOAN_DOCUMENTS = 'LOAN_DOCUMENTS',
  KYC_DOCUMENTS = 'KYC_DOCUMENTS',
  FINANCIAL_STATEMENTS = 'FINANCIAL_STATEMENTS',
  LEGAL_DOCUMENTS = 'LEGAL_DOCUMENTS',
  COMMUNICATION = 'COMMUNICATION',
  AUDIT_RECORDS = 'AUDIT_RECORDS',
  COMPLIANCE_RECORDS = 'COMPLIANCE_RECORDS',
  OTHER = 'OTHER',
}

export enum RetentionStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  PENDING_PURGE = 'PENDING_PURGE',
  PURGED = 'PURGED',
  LEGAL_HOLD = 'LEGAL_HOLD',
}

export enum HoldType {
  LITIGATION = 'LITIGATION',
  REGULATORY_EXAMINATION = 'REGULATORY_EXAMINATION',
  INVESTIGATION = 'INVESTIGATION',
  CUSTOM = 'CUSTOM',
}

@Entity('document_retentions')
@Index(['documentId'])
@Index(['retentionExpiryDate'])
@Index(['status'])
export class DocumentRetention {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LoanApplicationDocument, { nullable: true })
  document: LoanApplicationDocument;

  @Column({ nullable: true })
  documentId: string;

  @Column({ nullable: true })
  documentType: string; // Document type if not linked to LoanApplicationDocument

  @Column({ nullable: true })
  documentPath: string; // File path if not linked

  @Column({
    type: 'enum',
    enum: RetentionCategory,
  })
  retentionCategory: RetentionCategory;

  @Column({ type: 'date' })
  documentDate: Date; // Original document date

  @Column({ type: 'int' })
  retentionPeriodYears: number; // Retention period in years

  @Column({ type: 'date' })
  retentionExpiryDate: Date; // When retention expires

  @Column({
    type: 'enum',
    enum: RetentionStatus,
    default: RetentionStatus.ACTIVE,
  })
  status: RetentionStatus;

  // Archival
  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ nullable: true })
  archivedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  archiveLocation: string; // Archive storage location

  // Legal Hold
  @Column({ type: 'boolean', default: false })
  onLegalHold: boolean;

  @Column({
    type: 'enum',
    enum: HoldType,
    nullable: true,
  })
  holdType: HoldType;

  @Column({ nullable: true })
  holdReason: string;

  @Column({ nullable: true })
  holdPlacedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  holdPlacedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  holdExpiryDate: Date;

  @Column({ nullable: true })
  holdReleasedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  holdReleasedAt: Date;

  // Purge
  @Column({ type: 'boolean', default: false })
  purged: boolean;

  @Column({ nullable: true })
  purgedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  purgedAt: Date;

  @Column('text', { nullable: true })
  purgeConfirmation: string; // Confirmation of purge

  @Column('text', { nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

