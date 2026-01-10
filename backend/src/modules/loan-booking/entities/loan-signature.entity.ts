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
import { LoanDocument } from './loan-document.entity';

export enum SignatureType {
  E_SIGNATURE = 'E-Signature',
  WET_SIGNATURE = 'Wet Signature',
  NOTARIZED = 'Notarized',
  DIGITAL_SIGNATURE = 'Digital Signature',
}

export enum SignatureStatus {
  PENDING = 'Pending',
  SIGNED = 'Signed',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
}

@Entity('loan_signatures')
@Index(['documentId'])
@Index(['status'])
@Index(['signatureType'])
export class LoanSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @ManyToOne(() => LoanDocument)
  @JoinColumn({ name: 'documentId' })
  document: LoanDocument;

  @Column({
    type: 'enum',
    enum: SignatureType,
  })
  signatureType: SignatureType;

  @Column({
    type: 'enum',
    enum: SignatureStatus,
    default: SignatureStatus.PENDING,
  })
  status: SignatureStatus;

  @Column()
  signerId: string; // Borrower/Applicant ID

  @Column()
  signerName: string; // Signer's full name

  @Column({ nullable: true })
  signerEmail: string; // Signer's email

  @Column({ nullable: true })
  signerPhone: string; // Signer's phone

  @Column({ type: 'text', nullable: true })
  signatureData: string; // Base64 encoded signature image/data

  @Column({ type: 'text', nullable: true })
  signatureUrl: string; // URL to signature file

  @Column({ type: 'timestamp', nullable: true })
  signedDate: Date;

  @Column({ nullable: true })
  signedBy: string; // User ID who signed (if different from signer)

  @Column({ type: 'text', nullable: true })
  ipAddress: string; // IP address from which signature was made

  @Column({ type: 'text', nullable: true })
  userAgent: string; // User agent from which signature was made

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // Signature request expiry date

  @Column({ type: 'text', nullable: true })
  notaryName: string; // Notary name (if notarized)

  @Column({ nullable: true })
  notaryLicenseNumber: string; // Notary license number

  @Column({ type: 'date', nullable: true })
  notarizedDate: Date; // Date of notarization

  @Column({ type: 'text', nullable: true })
  rejectionReason: string; // Reason for rejection if rejected

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

