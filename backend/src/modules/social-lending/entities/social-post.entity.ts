import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { SocialPostType, PostStatus } from '../dto/social-lending.dto';
import { SocialPostInteraction } from './social-post-interaction.entity';
import { SocialPostComment } from './social-post-comment.entity';

@Entity('social_posts')
@Index(['authorId'])
@Index(['postType'])
@Index(['status'])
@Index(['loanId'])
@Index(['createdAt'])
export class SocialPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  authorId: string;

  @Column({
    type: 'enum',
    enum: SocialPostType,
  })
  postType: SocialPostType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  loanId: string;

  @Column({ type: 'int', nullable: true })
  rating: number; // For reviews (1-5)

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PENDING,
  })
  status: PostStatus;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  commentCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'boolean', default: false })
  isAnonymous: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => SocialPostInteraction, (interaction) => interaction.post)
  interactions: SocialPostInteraction[];

  @OneToMany(() => SocialPostComment, (comment) => comment.post)
  comments: SocialPostComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

