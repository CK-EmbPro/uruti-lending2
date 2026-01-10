import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { MFAMethod } from '../dto/advanced-security.dto';

@Entity('mfa_configs')
@Index(['userId'])
@Index(['isEnabled'])
export class MFAConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: MFAMethod,
  })
  method: MFAMethod;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ nullable: true })
  secret: string; // TOTP secret

  @Column({ nullable: true })
  backupCodes: string; // JSON array of backup codes

  @Column({ type: 'int', default: 0 })
  failedAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

