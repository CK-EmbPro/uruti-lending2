import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SignatureStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

@Entity('e_signature_requests')
@Index(['entityType', 'entityId'])
@Index(['status'])
@Index(['createdAt'])
export class ESignatureRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string; // Reference to document

  @Column()
  documentName: string;

  @Column()
  entityType: string; // 'loan', 'application', etc.

  @Column()
  entityId: string;

  @Column({ type: 'json' })
  signers: Array<{
    name: string;
    email: string;
    phone?: string;
    role: string;
    order: number;
    status: string;
    signedAt?: string;
    ipAddress?: string;
  }>;

  @Column({
    type: 'enum',
    enum: SignatureStatus,
    default: SignatureStatus.DRAFT,
  })
  status: SignatureStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'boolean', default: true })
  requireAllSigners: boolean;

  @Column({ type: 'int', default: 0 })
  completionPercentage: number; // 0-100

  @Column({ nullable: true })
  signatureUrl: string; // URL for signing

  @Column({ nullable: true })
  signedDocumentUrl: string; // URL to signed document

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  externalSignatureId: string; // ID from external service (DocuSign, etc.)

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional metadata

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

