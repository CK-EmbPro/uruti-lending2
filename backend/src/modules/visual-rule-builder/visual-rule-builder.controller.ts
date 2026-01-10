import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VisualRuleBuilderService } from './services/visual-rule-builder.service';
import {
  CreateRuleDto,
  TestRuleDto,
} from './dto/visual-rule-builder.dto';
import { CompanyGuard } from '../../common/guards/company.guard';

@ApiTags('visual-rule-builder')
@ApiBearerAuth('JWT-auth')
@Controller('visual-rule-builder')
@UseGuards(CompanyGuard)
export class VisualRuleBuilderController {
  constructor(private readonly ruleBuilderService: VisualRuleBuilderService) {}

  @Post('rules')
  @ApiOperation({
    summary: 'Create visual rule',
    description: 'Creates a new visual rule with nodes, conditions, and actions. Supports drag-and-drop rule building with visual workflow designer.',
  })
  @ApiBody({ type: CreateRuleDto })
  @ApiResponse({
    status: 201,
    description: 'Visual rule created successfully',
  })
  async createRule(
    @Body() dto: CreateRuleDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const createdBy = req.user?.id || req.userId;
    return await this.ruleBuilderService.createRule(dto, companyId, createdBy);
  }

  @Get('rules')
  @ApiOperation({
    summary: 'Get visual rules',
    description: 'Returns list of visual rules, optionally filtered by type and status.',
  })
  @ApiQuery({ name: 'type', required: false, enum: ['CREDIT_DECISION', 'PRICING', 'COLLECTIONS', 'APPROVAL', 'RISK_ASSESSMENT', 'ELIGIBILITY'] })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'TESTING', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  @ApiResponse({
    status: 200,
    description: 'Visual rules retrieved successfully',
  })
  async getRules(
    @Query('type') type: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.ruleBuilderService.getRules(companyId, type as any, status as any);
  }

  @Post('rules/test')
  @ApiOperation({
    summary: 'Test rule',
    description: 'Tests a rule with sample data in sandbox environment. Returns execution results without affecting production data.',
  })
  @ApiBody({ type: TestRuleDto })
  @ApiResponse({
    status: 200,
    description: 'Rule test completed successfully',
  })
  async testRule(
    @Body() dto: TestRuleDto,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const testedBy = req.user?.id || req.userId;
    return await this.ruleBuilderService.testRule(dto, companyId, testedBy);
  }

  @Post('rules/:id/execute')
  @ApiOperation({
    summary: 'Execute rule',
    description: 'Executes an active rule against provided data. Used for production rule execution.',
  })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        data: { type: 'object', description: 'Input data for rule execution' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Rule executed successfully',
  })
  async executeRule(
    @Param('id') id: string,
    @Body() body: { data: Record<string, any> },
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.ruleBuilderService.executeRuleForData(id, body.data, companyId);
  }

  @Patch('rules/:id/activate')
  @ApiOperation({
    summary: 'Activate rule',
    description: 'Activates a rule for production use. Rule must be in DRAFT or TESTING status.',
  })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Rule activated successfully',
  })
  async activateRule(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    const activatedBy = req.user?.id || req.userId;
    await this.ruleBuilderService.activateRule(id, companyId, activatedBy);
    return { message: 'Rule activated successfully' };
  }

  @Get('rules/:id/impact')
  @ApiOperation({
    summary: 'Get impact analysis',
    description: 'Returns impact analysis for a rule including estimated affected loans, approval rate changes, and revenue impact.',
  })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: 200,
    description: 'Impact analysis retrieved successfully',
  })
  async getImpactAnalysis(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const companyId = req.user?.companyId || req.companyId;
    return await this.ruleBuilderService.getImpactAnalysis(id, companyId);
  }
}

