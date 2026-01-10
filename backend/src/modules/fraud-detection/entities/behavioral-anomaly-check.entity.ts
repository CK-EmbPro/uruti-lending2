import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('behavioral_anomaly_checks')
@Index(['applicationId'])
@Index(['deviceFingerprint'])
@Index(['flaggedForReview'])
@Index(['createdAt'])
export class BehavioralAnomalyCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @Column({ type: 'json', nullable: true })
  speedAnomaly: any; // SpeedAnomalyDto

  @Column({ type: 'json', nullable: true })
  locationAnomaly: any; // LocationAnomalyDto

  @Column({ type: 'json', nullable: true })
  usagePatternAnomaly: any; // UsagePatternAnomalyDto

  @Column({ type: 'json', nullable: true })
  multiPlatformAnomaly: any; // MultiPlatformAnomalyDto

  @Column({ type: 'int', default: 0 })
  overallAnomalyScore: number; // 0-100

  @Column({ type: 'boolean', default: false })
  flaggedForReview: boolean;

  @Column({ type: 'int', default: 70 })
  reviewThreshold: number;

  @Column({ nullable: true })
  deviceFingerprint: string;

  @Column({ nullable: true })
  platform: string;

  @CreateDateColumn()
  createdAt: Date;
}

