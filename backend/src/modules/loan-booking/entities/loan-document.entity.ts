import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { LoanBooking } from './loan-booking.entity';
import { LoanSignature } from './loan-signature.entity';

export enum DocumentType {
  LOAN_AGREEMENT = 'Loan Agreement',
  PROMISSORY_NOTE = 'Promissory Note',
  SECURITY_AGREEMENT = 'Security Agreement',
  DISCLOSURE_STATEMENT = 'Disclosure Statement',
  TERMS_AND_CONDITIONS = 'Terms and Conditions',
  OTHER = 'Other',
}

export enum DocumentStatus {
  DRAFT = 'Draft',
  GENERATED = 'Generated',
  PENDING_SIGNATURE = 'Pending Signature',
  SIGNED = 'Signed',
  NOTARIZED = 'Notarized',
  COMPLETED = 'Completed',
  EXPIRED = 'Expired',
}

@Entity('loan_documents')
@Index(['loanId'])
@Index(['status'])
@Index(['documentType'])
export class LoanDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  loanId: string;

  @ManyToOne(() => Loan)
  @JoinColumn({ name: 'loanId' })
  loan: Loan;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column()
  documentName: string;

  @Column({ type: 'text', nullable: true })
  filePath: string; // Path to generated document

  @Column({ nullable: true })
  fileUrl: string; // URL to access the document

  @Column({ nullable: true })
  fileType: string; // MIME type (e.g., application/pdf)

  @Column({ type: 'bigint', nullable: true })
  fileSize: number; // File size in bytes

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  templateId: string; // Template used to generate document

  @Column({ type: 'json', nullable: true })
  templateData: Record<string, any>; // Data used in template

  @Column({ type: 'date', nullable: true })
  generatedDate: Date;

  @Column({ nullable: true })
  generatedBy: string; // User ID who generated

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // Document expiry date

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @OneToMany(() => LoanSignature, (signature) => signature.document, { cascade: true })
  signatures: LoanSignature[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

