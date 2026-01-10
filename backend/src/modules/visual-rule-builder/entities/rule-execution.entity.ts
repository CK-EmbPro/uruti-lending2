import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('rule_executions')
@Index(['companyId', 'ruleId'])
@Index(['executedAt'])
export class RuleExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  ruleId: string;

  @Column({ type: 'json' })
  inputData: Record<string, any>;

  @Column({ type: 'json' })
  result: {
    matched: boolean;
    actions: Array<{ type: string; parameters: Record<string, any> }>;
    executionPath: string[];
  };

  @Column({ type: 'int' })
  executionTimeMs: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  executedAt: Date;
}

