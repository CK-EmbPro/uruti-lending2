import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Loan } from '../../loan/entities/loan.entity';
import { AccountUpdateType } from '../../../common/enums/account-update-type.enum';

@Entity('account_updates')
@Index(['loanId'])
@Index(['updateDate'])
@Index(['updateType'])
export class AccountUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column()
  loanId: string;

  @Column({ type: 'date' })
  updateDate: Date;

  @Column({
    type: 'enum',
    enum: AccountUpdateType,
  })
  updateType: AccountUpdateType;

  @Column({ type: 'boolean', default: false })
  identityVerified: boolean;

  @Column({ nullable: true })
  verificationMethod: string; // ID Check, Phone Verification, Email Verification, etc.

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ nullable: true })
  verifiedById: string;

  @Column({ type: 'date', nullable: true })
  verifiedDate: Date;

  // Old values
  @Column({ nullable: true })
  oldAddress: string;

  @Column({ nullable: true })
  oldCity: string;

  @Column({ nullable: true })
  oldState: string;

  @Column({ nullable: true })
  oldZipCode: string;

  @Column({ nullable: true })
  oldCountry: string;

  @Column({ nullable: true })
  oldPhone: string;

  @Column({ nullable: true })
  oldEmail: string;

  // New values
  @Column({ nullable: true })
  newAddress: string;

  @Column({ nullable: true })
  newCity: string;

  @Column({ nullable: true })
  newState: string;

  @Column({ nullable: true })
  newZipCode: string;

  @Column({ nullable: true })
  newCountry: string;

  @Column({ nullable: true })
  newPhone: string;

  @Column({ nullable: true })
  newEmail: string;

  @Column({ type: 'boolean', default: false })
  temporary: boolean;

  @Column({ type: 'date', nullable: true })
  temporaryUntil: Date;

  @Column({ type: 'boolean', default: false })
  systemValidated: boolean;

  @Column({ type: 'date', nullable: true })
  systemValidatedDate: Date;

  @Column({ type: 'boolean', default: false })
  borrowerConfirmed: boolean;

  @Column({ type: 'date', nullable: true })
  borrowerConfirmedDate: Date;

  @Column({ nullable: true })
  requestedBy: string;

  @Column({ nullable: true })
  requestedById: string;

  @Column({ nullable: true })
  processedBy: string;

  @Column({ nullable: true })
  processedById: string;

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

