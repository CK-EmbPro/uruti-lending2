import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('security_settings')
@Index(['companyId'], { unique: true })
export class SecuritySettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  companyId: string;

  @Column({ type: 'boolean', default: false })
  requireMFA: boolean;

  @Column({ type: 'int', default: 8 })
  passwordMinLength: number;

  @Column({ type: 'boolean', default: true })
  passwordRequireUppercase: boolean;

  @Column({ type: 'boolean', default: true })
  passwordRequireLowercase: boolean;

  @Column({ type: 'boolean', default: true })
  passwordRequireNumbers: boolean;

  @Column({ type: 'boolean', default: true })
  passwordRequireSpecialChars: boolean;

  @Column({ type: 'int', default: 30 })
  sessionTimeoutMinutes: number;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts: number;

  @Column({ type: 'int', default: 15 })
  lockoutDurationMinutes: number;

  @Column({ type: 'json', default: [] })
  ipWhitelist: string[];

  @Column({ type: 'json', default: [] })
  ipBlacklist: string[];

  @Column({ type: 'boolean', default: true })
  enableRateLimiting: boolean;

  @Column({ type: 'int', default: 100 })
  rateLimitRequestsPerMinute: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

