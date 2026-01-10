import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditEventType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  ACCESS = 'ACCESS',
  MODIFY = 'MODIFY',
  CUSTOM = 'CUSTOM',
}

export enum AuditEntityType {
  LOAN = 'LOAN',
  LOAN_APPLICATION = 'LOAN_APPLICATION',
  CUSTOMER = 'CUSTOMER',
  USER = 'USER',
  DOCUMENT = 'DOCUMENT',
  PAYMENT = 'PAYMENT',
  DISBURSEMENT = 'DISBURSEMENT',
  SECURITY = 'SECURITY',
  REPORT = 'REPORT',
  SETTING = 'SETTING',
  OTHER = 'OTHER',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['entityType'])
@Index(['entityId'])
@Index(['eventType'])
@Index(['timestamp'])
@Index(['ipAddress'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column({
    type: 'enum',
    enum: AuditEventType,
  })
  eventType: AuditEventType;

  @Column({
    type: 'enum',
    enum: AuditEntityType,
  })
  entityType: AuditEntityType;

  @Column({ nullable: true })
  entityId: string; // ID of the entity being audited

  @Column({ nullable: true })
  entityName: string; // Human-readable name

  // Action Details
  @Column('text', { nullable: true })
  description: string;

  @Column('jsonb', { nullable: true })
  oldValues: any; // Previous state (for updates)

  @Column('jsonb', { nullable: true })
  newValues: any; // New state (for updates/creates)

  @Column('jsonb', { nullable: true })
  metadata: any; // Additional context

  // Request Context
  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  requestId: string; // Request correlation ID

  @Column({ nullable: true })
  sessionId: string;

  // Location (if available)
  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  city: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;
}

