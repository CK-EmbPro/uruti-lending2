import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('forgery_templates')
@Index(['templateName'])
@Index(['isActive'])
@Index(['createdAt'])
export class ForgeryTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  templateName: string;

  @Column({ type: 'text' })
  templateDescription: string;

  @Column({ type: 'text', nullable: true })
  templateImageHash: string; // Hash of template image for matching

  @Column({ type: 'json', nullable: true })
  templateFeatures: any; // Extracted features for matching

  @Column({ type: 'int', default: 0 })
  matchCount: number; // Number of times this template was matched

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastMatchedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

