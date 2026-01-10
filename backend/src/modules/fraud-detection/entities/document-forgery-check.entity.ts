import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum ForgeryReviewStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  CONFIRMED_FRAUD = 'CONFIRMED_FRAUD',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

@Entity('document_forgery_checks')
@Index(['applicationId'])
@Index(['documentId'])
@Index(['requiresHumanReview'])
@Index(['reviewStatus'])
@Index(['createdAt'])
export class DocumentForgeryCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @Column()
  documentId: string;

  @Column({ type: 'json', nullable: true })
  fontAnalysis: any; // FontAnalysisResultDto

  @Column({ type: 'json', nullable: true })
  metadataAnalysis: any; // MetadataAnalysisResultDto

  @Column({ type: 'json', nullable: true })
  imageForensics: any; // ImageForensicsResultDto

  @Column({ type: 'json', nullable: true })
  templateMatch: any; // TemplateMatchResultDto

  @Column({ type: 'int', default: 0 })
  overallRiskScore: number; // 0-100

  @Column({ type: 'boolean', default: false })
  requiresHumanReview: boolean;

  @Column({ nullable: true })
  reviewReason: string;

  @Column({
    type: 'enum',
    enum: ForgeryReviewStatus,
    default: ForgeryReviewStatus.PENDING,
  })
  reviewStatus: ForgeryReviewStatus;

  @Column({ nullable: true })
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'boolean', default: false })
  isConfirmedFraud: boolean; // For feedback loop

  @CreateDateColumn()
  createdAt: Date;
}

