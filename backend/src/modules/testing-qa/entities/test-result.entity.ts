import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TestStatus } from '../dto/testing-qa.dto';

@Entity('test_results')
@Index(['testSuiteId'])
@Index(['status'])
@Index(['executedAt'])
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  testSuiteId: string;

  @Column()
  testSuiteName: string;

  @Column({
    type: 'enum',
    enum: TestStatus,
    default: TestStatus.PENDING,
  })
  status: TestStatus;

  @Column({ type: 'int' })
  totalTests: number;

  @Column({ type: 'int' })
  passedTests: number;

  @Column({ type: 'int' })
  failedTests: number;

  @Column({ type: 'int' })
  skippedTests: number;

  @Column({ type: 'int' })
  duration: number; // milliseconds

  @Column({ type: 'jsonb', nullable: true })
  testCaseResults: Array<{
    testCaseId: string;
    name: string;
    status: TestStatus;
    duration: number;
    errorMessage?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp' })
  executedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}

