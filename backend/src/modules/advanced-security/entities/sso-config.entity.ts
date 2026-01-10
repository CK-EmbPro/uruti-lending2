import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { SSOProvider } from '../dto/advanced-security.dto';

@Entity('sso_configs')
@Index(['userId'])
@Index(['provider'])
@Index(['isEnabled'])
export class SSOConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: SSOProvider,
  })
  provider: SSOProvider;

  @Column({ type: 'boolean', default: false })
  isEnabled: boolean;

  @Column({ nullable: true })
  providerUserId: string; // User ID from SSO provider

  @Column({ type: 'jsonb' })
  config: Record<string, any>; // Provider-specific configuration

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

