import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { CollectionAgencyType } from '../../../common/enums/collection-agency-type.enum';
import { ThirdPartyPlacement } from './third-party-placement.entity';

@Entity('collection_agencies')
@Index(['name'])
export class CollectionAgency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  legalName: string;

  @Column({
    type: 'enum',
    enum: CollectionAgencyType,
  })
  agencyType: CollectionAgencyType;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  contingencyRate: number; // Percentage for contingency type

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  flatFee: number; // Fixed fee for flat fee type

  @Column({ nullable: true })
  contactPerson: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  licenseNumber: string;

  @Column({ type: 'date', nullable: true })
  licenseExpiryDate: Date;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'text', nullable: true })
  terms: string;

  @Column({ nullable: true })
  recallConditions: string; // Conditions for account recall

  @OneToMany(() => ThirdPartyPlacement, (placement) => placement.agency, {
    cascade: false,
    eager: false,
  })
  placements: ThirdPartyPlacement[];

  @Column({ nullable: true })
  remarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

