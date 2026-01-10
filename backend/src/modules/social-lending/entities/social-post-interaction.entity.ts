import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { SocialPost } from './social-post.entity';

export enum InteractionType {
  LIKE = 'LIKE',
  SHARE = 'SHARE',
  HELPFUL = 'HELPFUL',
  REPORT = 'REPORT',
}

@Entity('social_post_interactions')
@Index(['postId'])
@Index(['userId'])
@Index(['interactionType'])
@Unique(['postId', 'userId', 'interactionType'])
export class SocialPostInteraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  postId: string;

  @ManyToOne(() => SocialPost)
  @JoinColumn({ name: 'postId' })
  post: SocialPost;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: InteractionType,
  })
  interactionType: InteractionType;

  @CreateDateColumn()
  createdAt: Date;
}

