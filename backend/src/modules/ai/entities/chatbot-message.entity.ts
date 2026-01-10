import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { ChatbotConversation } from './chatbot-conversation.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  QUICK_REPLY = 'quick_reply',
  CARD = 'card',
  LIST = 'list',
  BUTTON = 'button',
}

@Entity('chatbot_messages')
@Index(['conversationId', 'createdAt'])
@Index(['role'])
export class ChatbotMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  conversationId: string;

  @ManyToOne(() => ChatbotConversation, (conversation) => conversation.messages, { 
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: ChatbotConversation;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role: MessageRole;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Additional data (buttons, cards, etc.)

  @Column({ type: 'jsonb', nullable: true })
  context: Record<string, any>; // Context used for generating response

  @Column({ type: 'jsonb', nullable: true })
  systemData: Record<string, any>; // System data retrieved (loans, applications, etc.)

  @Column({ type: 'int', nullable: true })
  tokensUsed: number; // For tracking AI usage

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  confidence: number; // Confidence score of the response

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date;

  @Column({ type: 'int', nullable: true })
  responseTime: number; // Response time in milliseconds

  @CreateDateColumn()
  createdAt: Date;
}

