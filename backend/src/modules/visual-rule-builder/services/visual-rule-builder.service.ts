import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisualRule, RuleType, RuleStatus } from '../entities/visual-rule.entity';
import { RuleExecution } from '../entities/rule-execution.entity';
import {
  CreateRuleDto,
  RuleExecutionResult,
  TestRuleDto,
  RuleImpactAnalysis,
  RuleNode,
  ConditionOperator,
  LogicalOperator,
} from '../dto/visual-rule-builder.dto';

@Injectable()
export class VisualRuleBuilderService {
  private readonly logger = new Logger(VisualRuleBuilderService.name);

  constructor(
    @InjectRepository(VisualRule)
    private readonly ruleRepository: Repository<VisualRule>,
    @InjectRepository(RuleExecution)
    private readonly executionRepository: Repository<RuleExecution>,
  ) {}

  /**
   * Create visual rule
   */
  async createRule(
    dto: CreateRuleDto,
    companyId: string,
    createdBy: string,
  ): Promise<VisualRule> {
    this.logger.log(`Creating visual rule: ${dto.name} for company ${companyId}`);

    // Validate rule structure
    this.validateRuleStructure(dto.nodes);

    const rule = this.ruleRepository.create({
      companyId,
      name: dto.name,
      type: dto.type,
      description: dto.description,
      nodes: dto.nodes,
      priority: dto.priority || 0,
      status: RuleStatus.DRAFT,
      isActive: dto.isActive || false,
      metadata: { createdBy },
    });

    return await this.ruleRepository.save(rule);
  }

  /**
   * Get rules
   */
  async getRules(
    companyId: string,
    type?: RuleType,
    status?: RuleStatus,
  ): Promise<VisualRule[]> {
    const where: any = { companyId };
    if (type) {
      where.type = type;
    }
    if (status) {
      where.status = status;
    }

    return await this.ruleRepository.find({
      where,
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Test rule
   */
  async testRule(
    dto: TestRuleDto,
    companyId: string,
    testedBy: string,
  ): Promise<RuleExecutionResult> {
    const rule = await this.ruleRepository.findOne({
      where: { id: dto.ruleId, companyId },
    });

    if (!rule) {
      throw new Error(`Rule ${dto.ruleId} not found`);
    }

    const startTime = Date.now();

    // Execute rule
    const result = this.executeRule(rule.nodes, dto.testData);

    const executionTime = Date.now() - startTime;

    // Save execution
    const execution = this.executionRepository.create({
      companyId,
      ruleId: rule.id,
      inputData: dto.testData,
      result,
      executionTimeMs: executionTime,
    });

    await this.executionRepository.save(execution);

    // Update rule test results
    rule.testResults = {
      ...rule.testResults,
      [new Date().toISOString()]: {
        input: dto.testData,
        result,
        executionTime,
      },
    };
    rule.lastTestedAt = new Date();
    rule.lastTestedBy = testedBy;
    await this.ruleRepository.save(rule);

    return {
      id: execution.id,
      ruleId: rule.id,
      inputData: dto.testData,
      result,
      executionTimeMs: executionTime,
      executedAt: execution.executedAt.toISOString(),
    };
  }

  /**
   * Execute rule
   */
  async executeRuleForData(
    ruleId: string,
    data: Record<string, any>,
    companyId: string,
  ): Promise<RuleExecutionResult> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId, companyId, isActive: true, status: RuleStatus.ACTIVE },
    });

    if (!rule) {
      throw new Error(`Active rule ${ruleId} not found`);
    }

    const startTime = Date.now();
    const result = this.executeRule(rule.nodes, data);
    const executionTime = Date.now() - startTime;

    // Save execution
    const execution = this.executionRepository.create({
      companyId,
      ruleId: rule.id,
      inputData: data,
      result,
      executionTimeMs: executionTime,
    });

    await this.executionRepository.save(execution);

    // Update rule statistics
    rule.executionCount++;
    if (result.matched) {
      rule.successCount++;
    }
    await this.ruleRepository.save(rule);

    return {
      id: execution.id,
      ruleId: rule.id,
      inputData: data,
      result,
      executionTimeMs: executionTime,
      executedAt: execution.executedAt.toISOString(),
    };
  }

  /**
   * Activate rule
   */
  async activateRule(
    ruleId: string,
    companyId: string,
    activatedBy: string,
  ): Promise<void> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId, companyId },
    });

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    if (rule.status !== RuleStatus.TESTING && rule.status !== RuleStatus.DRAFT) {
      throw new Error(`Rule must be in DRAFT or TESTING status to activate`);
    }

    rule.status = RuleStatus.ACTIVE;
    rule.isActive = true;
    rule.activatedAt = new Date();
    rule.activatedBy = activatedBy;

    await this.ruleRepository.save(rule);

    this.logger.log(`Rule ${ruleId} activated`);
  }

  /**
   * Get impact analysis
   */
  async getImpactAnalysis(
    ruleId: string,
    companyId: string,
  ): Promise<RuleImpactAnalysis> {
    const rule = await this.ruleRepository.findOne({
      where: { id: ruleId, companyId },
    });

    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    // In production, would analyze historical data
    // For now, return estimated impact
    return {
      affectedLoans: 150, // Would calculate from historical data
      approvalRateChange: 5.2, // Percentage
      revenueImpact: 50000, // Estimated
      riskImpact: 'LOW',
      details: {
        ruleType: rule.type,
        estimatedMatches: 150,
        confidence: 0.85,
      },
    };
  }

  // Private helper methods

  private validateRuleStructure(nodes: RuleNode[]): void {
    if (!nodes || nodes.length === 0) {
      throw new Error('Rule must have at least one node');
    }

    // Validate node structure
    for (const node of nodes) {
      if (node.nodeType === 'CONDITION' && !node.condition) {
        throw new Error(`Condition node ${node.id} must have a condition`);
      }

      if (node.nodeType === 'ACTION' && !node.action) {
        throw new Error(`Action node ${node.id} must have an action`);
      }
    }
  }

  private executeRule(
    nodes: any[],
    data: Record<string, any>,
  ): {
    matched: boolean;
    actions: Array<{ type: string; parameters: Record<string, any> }>;
    executionPath: string[];
  } {
    const executionPath: string[] = [];
    const actions: Array<{ type: string; parameters: Record<string, any> }> = [];

    // Find root node (node with no parent)
    const rootNode = nodes.find((n) => !nodes.some((other) => other.children?.includes(n.id)));

    if (!rootNode) {
      throw new Error('No root node found in rule');
    }

    // Execute rule tree
    const matched = this.evaluateNode(rootNode, nodes, data, executionPath, actions);

    return {
      matched,
      actions,
      executionPath,
    };
  }

  private evaluateNode(
    node: any,
    allNodes: any[],
    data: Record<string, any>,
    executionPath: string[],
    actions: Array<{ type: string; parameters: Record<string, any> }>,
  ): boolean {
    executionPath.push(node.id);

    if (node.nodeType === 'CONDITION') {
      const conditionResult = this.evaluateCondition(node.condition, data);

      if (node.children && node.children.length > 0) {
        // Evaluate child nodes
        const childResults: boolean[] = [];
        for (const childId of node.children) {
          const childNode = allNodes.find((n) => n.id === childId);
          if (childNode) {
            const childResult = this.evaluateNode(childNode, allNodes, data, executionPath, actions);
            childResults.push(childResult);
          }
        }

        // Apply logical operator
        if (node.logicalOperator === LogicalOperator.AND) {
          return conditionResult && childResults.every((r) => r);
        } else if (node.logicalOperator === LogicalOperator.OR) {
          return conditionResult || childResults.some((r) => r);
        }

        return conditionResult;
      }

      return conditionResult;
    } else if (node.nodeType === 'ACTION') {
      actions.push({
        type: node.action.type,
        parameters: node.action.parameters,
      });

      // Actions are always "matched"
      if (node.children && node.children.length > 0) {
        for (const childId of node.children) {
          const childNode = allNodes.find((n) => n.id === childId);
          if (childNode) {
            this.evaluateNode(childNode, allNodes, data, executionPath, actions);
          }
        }
      }

      return true;
    } else if (node.nodeType === 'LOGIC') {
      // Logic node (AND/OR)
      if (node.children && node.children.length > 0) {
        const childResults: boolean[] = [];
        for (const childId of node.children) {
          const childNode = allNodes.find((n) => n.id === childId);
          if (childNode) {
            const childResult = this.evaluateNode(childNode, allNodes, data, executionPath, actions);
            childResults.push(childResult);
          }
        }

        if (node.logicalOperator === LogicalOperator.AND) {
          return childResults.every((r) => r);
        } else if (node.logicalOperator === LogicalOperator.OR) {
          return childResults.some((r) => r);
        }
      }

      return false;
    }

    return false;
  }

  private evaluateCondition(
    condition: any,
    data: Record<string, any>,
  ): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === conditionValue;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== conditionValue;
      case ConditionOperator.GREATER_THAN:
        return Number(fieldValue) > Number(conditionValue);
      case ConditionOperator.LESS_THAN:
        return Number(fieldValue) < Number(conditionValue);
      case ConditionOperator.GREATER_THAN_OR_EQUAL:
        return Number(fieldValue) >= Number(conditionValue);
      case ConditionOperator.LESS_THAN_OR_EQUAL:
        return Number(fieldValue) <= Number(conditionValue);
      case ConditionOperator.CONTAINS:
        return String(fieldValue).includes(String(conditionValue));
      case ConditionOperator.NOT_CONTAINS:
        return !String(fieldValue).includes(String(conditionValue));
      case ConditionOperator.IN:
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      case ConditionOperator.BETWEEN:
        return (
          Number(fieldValue) >= Number(conditionValue) &&
          Number(fieldValue) <= Number(condition.secondValue)
        );
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return false;
    }
  }

  private getFieldValue(data: Record<string, any>, field: string): any {
    // Support nested fields (e.g., "customer.creditScore")
    const parts = field.split('.');
    let value = data;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }
}

