import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ChatbotRole {
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  STAFF_ASSISTANT = 'STAFF_ASSISTANT',
}

export enum MessageType {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

@Entity('chatbot_conversations')
@Index(['userId'])
@Index(['companyId'])
@Index(['role'])
@Index(['createdAt'])
export class ChatbotConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  userId: string; // Customer ID or Staff User ID

  @Column({
    type: 'enum',
    enum: ChatbotRole,
    default: ChatbotRole.CUSTOMER_SUPPORT,
  })
  role: ChatbotRole;

  @Column({ type: 'json' })
  messages: Array<{
    id: string;
    type: MessageType;
    content: string;
    timestamp: string;
    confidence?: number;
    metadata?: Record<string, any>;
  }>;

  @Column({ type: 'boolean', default: false })
  requiresHumanHandoff: boolean;

  @Column({ nullable: true })
  handoffToUserId: string; // Staff user ID if handoff required

  @Column({ type: 'boolean', default: false })
  isResolved: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

