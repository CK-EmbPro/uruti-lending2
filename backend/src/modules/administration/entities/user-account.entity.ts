import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { UserStatus } from '../../../common/enums/user-status.enum';
import { Role } from './role.entity';

@Entity('user_accounts')
@Index(['email'], { unique: true })
@Index(['status'])
@Index(['companyId'])
export class UserAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // Hashed password

  @Column()
  name: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_ACTIVATION,
  })
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  isMfaEnabled: boolean;

  @Column({ nullable: true })
  mfaSecret: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date;

  @Column({ nullable: true })
  activatedBy: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  updatedBy: string;
}

