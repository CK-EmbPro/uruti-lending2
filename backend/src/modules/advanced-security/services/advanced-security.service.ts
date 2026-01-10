import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MFAConfig } from '../entities/mfa-config.entity';
import { SSOConfig } from '../entities/sso-config.entity';
import { SecurityAuditLog } from '../entities/security-audit-log.entity';
import {
  EnableMFADto,
  VerifyMFADto,
  SetupSSODto,
  SecurityAuditQueryDto,
  MFAMethod,
  SSOProvider,
  SecurityEventType,
  ThreatLevel,
} from '../dto/advanced-security.dto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class AdvancedSecurityService {
  private readonly logger = new Logger(AdvancedSecurityService.name);

  constructor(
    @InjectRepository(MFAConfig)
    private mfaRepository: Repository<MFAConfig>,
    @InjectRepository(SSOConfig)
    private ssoRepository: Repository<SSOConfig>,
    @InjectRepository(SecurityAuditLog)
    private auditRepository: Repository<SecurityAuditLog>,
  ) {}

  async enableMFA(userId: string, enableDto: EnableMFADto): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    // Check if MFA already enabled
    const existing = await this.mfaRepository.findOne({
      where: { userId, isEnabled: true },
    });

    if (existing) {
      throw new BadRequestException('MFA is already enabled for this user');
    }

    if (enableDto.method === MFAMethod.TOTP || enableDto.method === MFAMethod.APP) {
      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `Uruti Lending (${userId})`,
        issuer: 'Uruti Lending',
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      const mfaConfig = this.mfaRepository.create({
        userId,
        method: enableDto.method,
        secret: secret.base32,
        backupCodes: JSON.stringify(backupCodes),
        isEnabled: false, // Will be enabled after verification
      });

      await this.mfaRepository.save(mfaConfig);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

      // Log event
      await this.logSecurityEvent(userId, SecurityEventType.MFA_ENABLED, {
        method: enableDto.method,
      });

      return {
        secret: secret.base32,
        qrCode,
        backupCodes,
      };
    }

    throw new BadRequestException(`MFA method ${enableDto.method} not yet implemented`);
  }

  async verifyMFA(userId: string, verifyDto: VerifyMFADto): Promise<{ verified: boolean }> {
    const mfaConfig = await this.mfaRepository.findOne({
      where: { userId, isEnabled: false },
    });

    if (!mfaConfig) {
      throw new NotFoundException('MFA configuration not found');
    }

    if (mfaConfig.method === MFAMethod.TOTP || mfaConfig.method === MFAMethod.APP) {
      // Verify TOTP code
      let verified = speakeasy.totp.verify({
        secret: mfaConfig.secret,
        encoding: 'base32',
        token: verifyDto.code,
        window: 2, // Allow 2 time steps before/after
      });

      // Check backup codes
      if (!verified && mfaConfig.backupCodes) {
        const backupCodes = JSON.parse(mfaConfig.backupCodes);
        const codeIndex = backupCodes.indexOf(verifyDto.code);
        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          mfaConfig.backupCodes = JSON.stringify(backupCodes);
          verified = true;
        }
      }

      if (verified) {
        mfaConfig.isEnabled = true;
        mfaConfig.lastVerifiedAt = new Date();
        mfaConfig.failedAttempts = 0;
        await this.mfaRepository.save(mfaConfig);

        await this.logSecurityEvent(userId, SecurityEventType.MFA_VERIFIED, {
          method: mfaConfig.method,
        });

        return { verified: true };
      } else {
        mfaConfig.failedAttempts += 1;
        await this.mfaRepository.save(mfaConfig);

        await this.logSecurityEvent(userId, SecurityEventType.MFA_FAILED, {
          method: mfaConfig.method,
          failedAttempts: mfaConfig.failedAttempts,
        }, ThreatLevel.MEDIUM);

        return { verified: false };
      }
    }

    throw new BadRequestException(`MFA method ${mfaConfig.method} not yet implemented`);
  }

  async disableMFA(userId: string): Promise<void> {
    const mfaConfig = await this.mfaRepository.findOne({
      where: { userId, isEnabled: true },
    });

    if (!mfaConfig) {
      throw new NotFoundException('MFA is not enabled for this user');
    }

    mfaConfig.isEnabled = false;
    await this.mfaRepository.save(mfaConfig);

    await this.logSecurityEvent(userId, SecurityEventType.MFA_DISABLED);
  }

  async getMFAStatus(userId: string): Promise<{ isEnabled: boolean; method?: MFAMethod }> {
    const mfaConfig = await this.mfaRepository.findOne({
      where: { userId, isEnabled: true },
    });

    return {
      isEnabled: !!mfaConfig,
      method: mfaConfig?.method,
    };
  }

  async setupSSO(userId: string, setupDto: SetupSSODto): Promise<SSOConfig> {
    const ssoConfig = this.ssoRepository.create({
      userId,
      provider: setupDto.provider,
      config: setupDto.config,
      isEnabled: true,
    });

    return this.ssoRepository.save(ssoConfig);
  }

  async getSSOConfigs(userId: string): Promise<SSOConfig[]> {
    return this.ssoRepository.find({
      where: { userId, isEnabled: true },
    });
  }

  async logSecurityEvent(
    userId: string | null,
    eventType: SecurityEventType,
    metadata?: Record<string, any>,
    threatLevel: ThreatLevel = ThreatLevel.LOW,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SecurityAuditLog> {
    const log = this.auditRepository.create({
      userId,
      eventType,
      threatLevel,
      ipAddress,
      userAgent,
      metadata,
      timestamp: new Date(),
    });

    return this.auditRepository.save(log);
  }

  async getSecurityAuditLogs(query: SecurityAuditQueryDto): Promise<SecurityAuditLog[]> {
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.eventType) where.eventType = query.eventType;

    const queryBuilder = this.auditRepository.createQueryBuilder('log')
      .where(where);

    if (query.startDate) {
      queryBuilder.andWhere('log.timestamp >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      queryBuilder.andWhere('log.timestamp <= :endDate', { endDate: new Date(query.endDate) });
    }

    queryBuilder.orderBy('log.timestamp', 'DESC')
      .limit(query.limit || 100);

    return queryBuilder.getMany();
  }

  async getSecurityStats(userId?: string): Promise<Record<string, any>> {
    const where: any = {};
    if (userId) where.userId = userId;

    const totalEvents = await this.auditRepository.count({ where });
    const failedLogins = await this.auditRepository.count({
      where: { ...where, eventType: SecurityEventType.LOGIN_FAILED },
    });
    const suspiciousActivity = await this.auditRepository.count({
      where: { ...where, threatLevel: ThreatLevel.HIGH },
    });

    return {
      totalEvents,
      failedLogins,
      suspiciousActivity,
      securityScore: this.calculateSecurityScore(totalEvents, failedLogins, suspiciousActivity),
    };
  }

  private calculateSecurityScore(total: number, failed: number, suspicious: number): number {
    if (total === 0) return 100;
    const score = 100 - (failed * 2) - (suspicious * 5);
    return Math.max(0, Math.min(100, score));
  }

  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
