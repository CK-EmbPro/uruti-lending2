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
import { PaymentMethodType, PaymentMethodStatus } from '../dto/customer-portal-enhanced.dto';
import { CustomerPortalUser } from '../../customer-portal/entities/customer-portal-user.entity';

@Entity('customer_payment_methods')
@Index(['customerId'])
@Index(['status'])
@Index(['isDefault'])
export class CustomerPaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => CustomerPortalUser)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerPortalUser;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  @Column()
  last4: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodStatus,
    default: PaymentMethodStatus.PENDING_VERIFICATION,
  })
  status: PaymentMethodStatus;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column()
  tokenId: string; // Tokenized ID from payment processor

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

