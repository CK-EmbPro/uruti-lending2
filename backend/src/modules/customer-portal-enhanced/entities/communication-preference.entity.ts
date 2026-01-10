import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CommunicationPreference } from '../dto/customer-portal-enhanced.dto';
import { CustomerPortalUser } from '../../customer-portal/entities/customer-portal-user.entity';

@Entity('customer_communication_preferences')
@Index(['customerId'], { unique: true })
export class CustomerCommunicationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  customerId: string;

  @ManyToOne(() => CustomerPortalUser)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerPortalUser;

  @Column({
    type: 'enum',
    enum: CommunicationPreference,
    default: CommunicationPreference.EMAIL,
  })
  paymentReminders: CommunicationPreference;

  @Column({
    type: 'enum',
    enum: CommunicationPreference,
    default: CommunicationPreference.EMAIL,
  })
  statementNotifications: CommunicationPreference;

  @Column({
    type: 'enum',
    enum: CommunicationPreference,
    default: CommunicationPreference.EMAIL,
  })
  accountUpdates: CommunicationPreference;

  @Column({
    type: 'enum',
    enum: CommunicationPreference,
    default: CommunicationPreference.NONE,
  })
  marketing: CommunicationPreference;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

