import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { LoanRestructure } from './loan-restructure.entity';

export enum AcknowledgmentMethod {
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE',
  ELECTRONIC_CONSENT = 'ELECTRONIC_CONSENT',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  IN_PERSON = 'IN_PERSON',
}

@Entity('restructure_acknowledgments')
@Index(['restructureId'], { unique: true })
@Index(['acknowledgedAt'])
export class RestructureAcknowledgment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  restructureId: string;

  @ManyToOne(() => LoanRestructure)
  @JoinColumn({ name: 'restructureId' })
  restructure: LoanRestructure;

  @Column()
  borrowerId: string; // Borrower who acknowledged

  @Column({ type: 'timestamp' })
  acknowledgedAt: Date;

  @Column({
    type: 'enum',
    enum: AcknowledgmentMethod,
  })
  acknowledgmentMethod: AcknowledgmentMethod;

  @Column({ type: 'text', nullable: true })
  acknowledgmentText: string; // Text that was acknowledged

  @Column({ type: 'text', nullable: true })
  ipAddress: string; // IP address if digital acknowledgment

  @Column({ type: 'text', nullable: true })
  userAgent: string; // User agent if digital acknowledgment

  @Column({ type: 'text', nullable: true })
  signatureData: string; // Digital signature data or document path

  @Column({ type: 'boolean', default: false })
  termsRead: boolean; // Confirmation that terms were read

  @Column({ type: 'boolean', default: false })
  impactUnderstood: boolean; // Confirmation that impact was understood

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}

