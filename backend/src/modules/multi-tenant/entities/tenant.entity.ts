import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('tenants')
@Index(['subdomain'])
@Index(['customDomain'])
@Index(['isActive'])
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column({ nullable: true, unique: true })
  customDomain: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  config: Record<string, any>; // Tenant-specific configuration

  @Column({ type: 'jsonb', nullable: true })
  branding: Record<string, any>; // Logo, colors, etc.

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, boolean>; // Feature flags

  @Column({ type: 'jsonb', nullable: true })
  limits: Record<string, number>; // Usage limits

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

