import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ChatbotMessage } from './chatbot-message.entity';

export enum ConversationStatus {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
  RESOLVED = 'Resolved',
}

export enum ConversationContext {
  GENERAL = 'General',
  LOAN_INQUIRY = 'Loan Inquiry',
  APPLICATION_STATUS = 'Application Status',
  REPAYMENT = 'Repayment',
  PRODUCT_RECOMMENDATION = 'Product Recommendation',
  TECHNICAL_SUPPORT = 'Technical Support',
  ACCOUNT_MANAGEMENT = 'Account Management',
}

@Entity('chatbot_conversations')
@Index(['userId', 'status'])
@Index(['userId', 'createdAt'])
@Index(['context'])
export class ChatbotConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string; // Can be null for anonymous users

  @Column({ nullable: true })
  sessionId: string; // For tracking anonymous sessions

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
  })
  status: ConversationStatus;

  @Column({
    type: 'enum',
    enum: ConversationContext,
    default: ConversationContext.GENERAL,
  })
  context: ConversationContext;

  @Column({ type: 'text', nullable: true })
  title: string; // Auto-generated from first message

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // User info, loan IDs, etc.

  @Column({ type: 'int', default: 0 })
  messageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @Column({ type: 'boolean', default: false })
  escalatedToHuman: boolean;

  @Column({ nullable: true })
  escalatedToUserId: string; // If escalated to human agent

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  userProfile: Record<string, any>; // Cached user profile for context

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => ChatbotMessage, (message) => message.conversation)
  messages: ChatbotMessage[];
}

