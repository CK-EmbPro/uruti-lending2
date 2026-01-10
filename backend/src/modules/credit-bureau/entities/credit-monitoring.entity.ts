import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('credit_monitoring')
@Index(['companyId', 'customerId'], { unique: true })
@Index(['isEnabled'])
export class CreditMonitoring {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  customerId: string;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  alertPreferences: {
    scoreChangeThreshold?: number;
    newInquiry?: boolean;
    newAccount?: boolean;
    paymentMissed?: boolean;
    publicRecord?: boolean;
  };

  @Column({ type: 'int', nullable: true })
  lastScore: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCheckedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextCheckAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

