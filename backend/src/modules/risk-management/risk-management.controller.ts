import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RiskManagementService } from './services/risk-management.service';
import { AssessConcentrationRiskDto, TakeCorrectiveActionDto } from './dto/concentration-risk.dto';
import { CreateStressTestDto, RunStressTestDto } from './dto/stress-test.dto';
import { DetectEarlyWarningSignalsDto, InvestigateSignalDto, ResolveSignalDto } from './dto/early-warning-signal.dto';
import { InitiateRevaluationDto, UpdateValuationDto, TakeRevaluationActionDto } from './dto/collateral-revaluation.dto';
import { ConcentrationType, RiskLevel } from './entities/concentration-risk.entity';
import { StressTestType, StressTestStatus } from './entities/stress-test.entity';
import { SignalType, SignalSeverity, SignalStatus } from './entities/early-warning-signal.entity';
import { RevaluationStatus } from './entities/collateral-revaluation.entity';

@ApiTags('risk-management')
@ApiBearerAuth('JWT-auth')
@Controller('risk-management')
export class RiskManagementController {
  constructor(private readonly riskManagementService: RiskManagementService) {}

  /**
   * UC-040: Concentration Risk Monitoring
   */
  @Post('concentration-risk/assess')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Assess concentration risk',
    description: 'Assesses concentration risk by geography, industry, product, or customer segment',
  })
  @ApiResponse({
    status: 201,
    description: 'Concentration risk assessment completed successfully',
  })
  async assessConcentrationRisk(
    @Body() dto: AssessConcentrationRiskDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.assessConcentrationRisk(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('concentration-risk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get concentration risks',
    description: 'Retrieves concentration risk assessments with optional filters',
  })
  async getConcentrationRisks(
    @Query('concentrationType') concentrationType?: ConcentrationType,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('limitExceeded') limitExceeded?: boolean,
    @Query('companyId') companyId?: string,
  ) {
    return this.riskManagementService.getConcentrationRisks({
      concentrationType,
      riskLevel,
      limitExceeded: typeof limitExceeded === 'string' ? limitExceeded === 'true' : limitExceeded === true,
      companyId,
    });
  }

  @Post('concentration-risk/:id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Take corrective action on concentration risk',
    description: 'Documents corrective action taken for concentration risk',
  })
  async takeCorrectiveAction(
    @Param('id') id: string,
    @Body() dto: TakeCorrectiveActionDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.takeCorrectiveAction(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-041: Stress Testing
   */
  @Post('stress-tests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create stress test',
    description: 'Creates a new stress test scenario',
  })
  @ApiResponse({
    status: 201,
    description: 'Stress test created successfully',
  })
  async createStressTest(
    @Body() dto: CreateStressTestDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.createStressTest(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('stress-tests/:id/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Run stress test',
    description: 'Executes a stress test scenario and calculates projected losses',
  })
  async runStressTest(
    @Param('id') id: string,
    @Body() dto: RunStressTestDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.runStressTest(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('stress-tests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get stress tests',
    description: 'Retrieves stress test results with optional filters',
  })
  async getStressTests(
    @Query('testType') testType?: StressTestType,
    @Query('status') status?: StressTestStatus,
    @Query('companyId') companyId?: string,
  ) {
    return this.riskManagementService.getStressTests({
      testType,
      status,
      companyId,
    });
  }

  /**
   * UC-042: Early Warning Signal Detection
   */
  @Post('early-warning-signals/detect')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Detect early warning signals',
    description: 'Monitors accounts for risk signals and payment pattern changes',
  })
  @ApiResponse({
    status: 201,
    description: 'Early warning signals detected successfully',
  })
  async detectEarlyWarningSignals(
    @Body() dto: DetectEarlyWarningSignalsDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.detectEarlyWarningSignals(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('early-warning-signals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get early warning signals',
    description: 'Retrieves early warning signals with optional filters',
  })
  async getEarlyWarningSignals(
    @Query('loanId') loanId?: string,
    @Query('signalType') signalType?: SignalType,
    @Query('severity') severity?: SignalSeverity,
    @Query('status') status?: SignalStatus,
  ) {
    return this.riskManagementService.getEarlyWarningSignals({
      loanId,
      signalType,
      severity,
      status,
    });
  }

  @Post('early-warning-signals/:id/investigate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Investigate early warning signal',
    description: 'Marks a signal for investigation and documents findings',
  })
  async investigateSignal(
    @Param('id') id: string,
    @Body() dto: InvestigateSignalDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.investigateSignal(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('early-warning-signals/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve early warning signal',
    description: 'Marks a signal as resolved with resolution notes',
  })
  async resolveSignal(
    @Param('id') id: string,
    @Body() dto: ResolveSignalDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.resolveSignal(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  /**
   * UC-043: Collateral Revaluation
   */
  @Post('collateral-revaluations/initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate collateral revaluation',
    description: 'Initiates a collateral revaluation for a secured loan',
  })
  @ApiResponse({
    status: 201,
    description: 'Collateral revaluation initiated successfully',
  })
  async initiateRevaluation(
    @Body() dto: InitiateRevaluationDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.initiateRevaluation(
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Post('collateral-revaluations/:id/update-valuation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update collateral valuation',
    description: 'Updates collateral valuation and calculates new LTV',
  })
  async updateValuation(
    @Param('id') id: string,
    @Body() dto: UpdateValuationDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.updateValuation(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }

  @Get('collateral-revaluations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get collateral revaluations',
    description: 'Retrieves collateral revaluations with optional filters',
  })
  async getCollateralRevaluations(
    @Query('loanId') loanId?: string,
    @Query('securityId') securityId?: string,
    @Query('status') status?: RevaluationStatus,
    @Query('underCollateralized') underCollateralized?: boolean,
  ) {
    return this.riskManagementService.getCollateralRevaluations({
      loanId,
      securityId,
      status,
      underCollateralized: typeof underCollateralized === 'string' ? underCollateralized === 'true' : underCollateralized === true,
    });
  }

  @Post('collateral-revaluations/:id/action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Take action on collateral revaluation',
    description: 'Documents action taken for under-collateralized loans',
  })
  async takeRevaluationAction(
    @Param('id') id: string,
    @Body() dto: TakeRevaluationActionDto,
    @Request() req: any,
  ) {
    return this.riskManagementService.takeRevaluationAction(
      id,
      dto,
      req.user.id,
      req.user.name || req.user.email,
    );
  }
}

