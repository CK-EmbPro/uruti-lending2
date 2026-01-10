import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum MobilePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

@Entity('device_registrations')
@Index(['userId'])
@Index(['companyId'])
@Index(['deviceToken'])
export class DeviceRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  userId: string;

  @Column()
  deviceToken: string;

  @Column({
    type: 'enum',
    enum: MobilePlatform,
  })
  platform: MobilePlatform;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  appVersion: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

