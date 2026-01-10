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
import { CustomerPortalUser } from '../../customer-portal/entities/customer-portal-user.entity';

@Entity('customer_documents')
@Index(['customerId'])
@Index(['documentType'])
@Index(['uploadedDate'])
export class CustomerDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => CustomerPortalUser)
  @JoinColumn({ name: 'customerId' })
  customer: CustomerPortalUser;

  @Column({ nullable: true })
  loanApplicationId: string;

  @Column()
  documentType: string;

  @Column()
  documentName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  fileSize: number; // bytes

  @Column()
  mimeType: string;

  @Column({ type: 'date' })
  uploadedDate: Date;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'date', nullable: true })
  verifiedDate: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

