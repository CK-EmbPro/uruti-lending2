import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  INCOME = 'Income',
  EXPENSE = 'Expense',
  EQUITY = 'Equity',
}

export enum RootType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  INCOME = 'Income',
  EXPENSE = 'Expense',
  EQUITY = 'Equity',
}

@Entity('accounts')
@Index(['accountCode', 'companyId'], { unique: true })
@Index(['companyId'])
@Index(['parentAccountId'])
@Index(['rootType'])
@Index(['accountType'])
@Index(['isGroup'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountCode: string; // Unique per company

  @Column()
  accountName: string;

  @Column({
    type: 'enum',
    enum: AccountType,
  })
  accountType: AccountType;

  @Column({
    type: 'enum',
    enum: RootType,
  })
  rootType: RootType; // Root account type for reporting

  @Column({ type: 'boolean', default: false })
  isGroup: boolean; // True if this is a group account (parent)

  @ManyToOne(() => Account, (account) => account.childAccounts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  parentAccount: Account;

  @Column({ nullable: true })
  parentAccountId: string;

  @OneToMany(() => Account, (account) => account.parentAccount)
  childAccounts: Account[];

  @Column()
  companyId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  openingBalance: number; // Opening balance

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isFrozen: boolean; // Frozen accounts cannot be used

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  accountNumber: string; // Bank account number if applicable

  @Column({ nullable: true })
  bankName: string; // Bank name if applicable

  @Column({ nullable: true })
  currency: string; // Account currency (defaults to company currency)

  @Column({ type: 'int', default: 0 })
  level: number; // Hierarchy level (0 = root)

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

