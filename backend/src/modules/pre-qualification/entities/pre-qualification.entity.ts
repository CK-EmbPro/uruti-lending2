import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('pre_qualifications')
@Index(['email', 'phoneNumber'])
@Index(['token'])
export class PreQualification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ unique: true })
  token: string; // Unique token for anonymous access

  @Column('decimal', { precision: 15, scale: 2 })
  requestedAmount: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  estimatedApprovedAmount: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  estimatedInterestRate: number;

  @Column({ type: 'int', nullable: true })
  estimatedTerm: number; // in months

  @Column({ nullable: true })
  loanProductId: string;

  @Column({ nullable: true })
  loanProductName: string;

  @Column({ type: 'text', nullable: true })
  preQualificationResult: string; // JSON string with detailed results

  @Column({ type: 'boolean', default: false })
  isConverted: boolean; // Whether converted to application

  @Column({ nullable: true })
  convertedApplicationId: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date; // Offer expiry date

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

