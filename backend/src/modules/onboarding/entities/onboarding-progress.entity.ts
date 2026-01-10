import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OnboardingStep, OnboardingStatus, Platform } from '../dto/zero-branch-onboarding.dto';

@Entity('onboarding_progress')
@Index(['applicationId'])
@Index(['status'])
@Index(['currentStep'])
export class OnboardingProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicationId: string;

  @Column({
    type: 'enum',
    enum: OnboardingStep,
    default: OnboardingStep.PROFILE,
  })
  currentStep: OnboardingStep;

  @Column({
    type: 'enum',
    enum: OnboardingStatus,
    default: OnboardingStatus.IN_PROGRESS,
  })
  status: OnboardingStatus;

  @Column({ type: 'int', default: 0 })
  completionPercentage: number; // 0-100

  @Column({ type: 'jsonb' })
  formData: Record<string, any>; // Saved form data

  @Column({
    type: 'enum',
    enum: Platform,
    nullable: true,
  })
  platform?: Platform;

  @Column({ type: 'jsonb', nullable: true })
  biometricData?: {
    selfieUrl?: string;
    idPhotoUrl?: string;
    matchStatus?: string;
    matchConfidence?: number;
    matchedAt?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  signatureData?: {
    signatureId?: string;
    signatureUrl?: string;
    signedAt?: string;
    isLegallyBinding?: boolean;
  };

  @Column({ type: 'boolean', default: false })
  isRemote: boolean; // Whether onboarding was completed remotely

  @Column({ type: 'boolean', default: false })
  requiresBranchVisit: boolean; // Whether branch visit is required

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastSavedAt: Date;
}

