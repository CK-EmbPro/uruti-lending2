import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdvancedSecurityService } from './services/advanced-security.service';
import {
  EnableMFADto,
  VerifyMFADto,
  SetupSSODto,
  SecurityAuditQueryDto,
} from './dto/advanced-security.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Advanced Security')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('advanced-security')
export class AdvancedSecurityController {
  constructor(private readonly securityService: AdvancedSecurityService) {}

  @Post('mfa/enable')
  @ApiOperation({ summary: 'Enable MFA' })
  @ApiResponse({ status: 201, description: 'MFA enabled successfully' })
  enableMFA(
    @Request() req: any,
    @Body() enableDto: EnableMFADto,
  ) {
    return this.securityService.enableMFA(req.user.id, enableDto);
  }

  @Post('mfa/verify')
  @ApiOperation({ summary: 'Verify MFA code' })
  @ApiResponse({ status: 200, description: 'MFA verified' })
  verifyMFA(
    @Request() req: any,
    @Body() verifyDto: VerifyMFADto,
  ) {
    return this.securityService.verifyMFA(req.user.id, verifyDto);
  }

  @Delete('mfa/disable')
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  disableMFA(@Request() req: any) {
    return this.securityService.disableMFA(req.user.id);
  }

  @Get('mfa/status')
  @ApiOperation({ summary: 'Get MFA status' })
  @ApiResponse({ status: 200, description: 'MFA status' })
  getMFAStatus(@Request() req: any) {
    return this.securityService.getMFAStatus(req.user.id);
  }

  @Post('sso/setup')
  @ApiOperation({ summary: 'Setup SSO' })
  @ApiResponse({ status: 201, description: 'SSO configured successfully' })
  setupSSO(
    @Request() req: any,
    @Body() setupDto: SetupSSODto,
  ) {
    return this.securityService.setupSSO(req.user.id, setupDto);
  }

  @Get('sso/configs')
  @ApiOperation({ summary: 'Get SSO configurations' })
  @ApiResponse({ status: 200, description: 'SSO configurations' })
  getSSOConfigs(@Request() req: any) {
    return this.securityService.getSSOConfigs(req.user.id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get security audit logs' })
  @ApiResponse({ status: 200, description: 'Security audit logs' })
  getSecurityAuditLogs(@Query() query: SecurityAuditQueryDto) {
    return this.securityService.getSecurityAuditLogs(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get security statistics' })
  @ApiResponse({ status: 200, description: 'Security statistics' })
  getSecurityStats(@Query('userId') userId?: string) {
    return this.securityService.getSecurityStats(userId);
  }
}
