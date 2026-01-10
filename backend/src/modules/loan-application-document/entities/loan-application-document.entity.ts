import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';

export enum DocumentStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
}

@Entity('loan_application_documents')
@Index(['loanApplicationId', 'documentType'])
export class LoanApplicationDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  loanApplicationId: string;

  @ManyToOne(() => LoanApplication, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'loanApplicationId' })
  loanApplication: LoanApplication;

  @Column()
  documentType: string; // Link to Document Type master

  @Column()
  documentName: string; // Display name

  @Column({ nullable: true })
  documentNumber: string; // Document number (e.g., PAN, Aadhaar)

  @Column({ type: 'text', nullable: true })
  filePath: string; // Path to uploaded file

  @Column({ nullable: true })
  fileUrl: string; // URL to access the document

  @Column({ nullable: true })
  fileType: string; // MIME type (e.g., application/pdf, image/jpeg)

  @Column({ type: 'bigint', nullable: true })
  fileSize: number; // File size in bytes

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ type: 'date', nullable: true })
  issueDate: Date; // Document issue date

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // Document expiry date

  @Column({ type: 'date', nullable: true })
  verificationDate: Date; // Date when document was verified

  @Column({ nullable: true })
  verifiedBy: string; // User ID who verified

  @Column({ type: 'text', nullable: true })
  remarks: string; // Verification remarks

  @Column({ type: 'text', nullable: true })
  rejectionReason: string; // Reason for rejection if rejected

  @Column({ type: 'boolean', default: false })
  isRequired: boolean; // Whether this document is required

  @Column({ type: 'int', default: 0 })
  version: number; // Document version (for updates)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

