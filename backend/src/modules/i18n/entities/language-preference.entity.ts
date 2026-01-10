import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SupportedLanguage {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  ZH = 'zh',
  JA = 'ja',
  AR = 'ar',
  HI = 'hi',
}

@Entity('language_preferences')
@Index(['userId'], { unique: true })
@Index(['companyId'])
export class LanguagePreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: SupportedLanguage,
    default: SupportedLanguage.EN,
  })
  language: SupportedLanguage;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

