import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisualRuleBuilderService } from './services/visual-rule-builder.service';
import { VisualRuleBuilderController } from './visual-rule-builder.controller';
import { VisualRule } from './entities/visual-rule.entity';
import { RuleExecution } from './entities/rule-execution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VisualRule, RuleExecution])],
  controllers: [VisualRuleBuilderController],
  providers: [VisualRuleBuilderService],
  exports: [VisualRuleBuilderService],
})
export class VisualRuleBuilderModule {}

