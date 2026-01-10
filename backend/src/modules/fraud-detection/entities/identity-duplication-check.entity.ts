import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('identity_duplication_checks')
@Index(['applicationId'])
@Index(['idNumber'])
@Index(['phoneNumber'])
@Index(['email'])
@Index(['deviceFingerprint'])
@Index(['biometricHash'])
@Index(['bankAccountNumber'])
@Index(['createdAt'])
export class IdentityDuplicationCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @Column({ nullable: true })
  idNumber: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({ nullable: true })
  biometricHash: string;

  @Column({ nullable: true })
  bankAccountNumber: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ type: 'json', nullable: true })
  duplicates: any[]; // Array of DuplicateMatchDto

  @Column({ type: 'json', nullable: true })
  suspiciousPatterns: any[]; // Array of SuspiciousPatternDto

  @Column({ type: 'int', default: 0 })
  riskScore: number; // 0-100

  @Column({ type: 'boolean', default: false })
  flaggedForReview: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

