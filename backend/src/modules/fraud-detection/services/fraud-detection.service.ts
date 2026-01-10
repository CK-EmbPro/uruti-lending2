import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import {
  FraudCheckRequestDto,
  FraudCheckResultDto,
  FraudRiskLevel,
} from '../dto/fraud-detection.dto';
import { FraudCheck } from '../entities/fraud-check.entity';

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(FraudCheck)
    private readonly fraudCheckRepository: Repository<FraudCheck>,
  ) {}

  /**
   * Check for fraud indicators
   */
  async checkFraud(
    dto: FraudCheckRequestDto,
    companyId: string,
  ): Promise<FraudCheckResultDto> {
    this.logger.log(`Checking fraud for application ${dto.applicationId}`);

    // Check application exists
    const application = await this.applicationRepository.findOne({
      where: { id: dto.applicationId, companyId },
    });

    if (!application) {
      throw new Error(`Application ${dto.applicationId} not found`);
    }

    // Calculate risk factors
    const factors = await this.calculateRiskFactors(dto, companyId);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(factors);

    // Determine risk level
    const riskLevel = this.determineRiskLevel(riskScore);

    // Check if flagged
    const isFlagged = riskLevel === FraudRiskLevel.HIGH || riskLevel === FraudRiskLevel.CRITICAL;

    // Get indicators
    const indicators = this.getFraudIndicators(factors, riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLevel, factors);

    // Determine if verification required
    const requiresVerification = riskLevel !== FraudRiskLevel.LOW;

    // Save fraud check record
    const fraudCheck = this.fraudCheckRepository.create({
      applicationId: dto.applicationId,
      email: dto.email,
      phone: dto.phone,
      ipAddress: dto.ipAddress,
      deviceFingerprint: dto.deviceFingerprint,
      riskLevel,
      riskScore,
      isFlagged,
      indicators,
      factors,
      requiresVerification,
    });
    await this.fraudCheckRepository.save(fraudCheck);

    return {
      riskLevel,
      riskScore,
      isFlagged,
      indicators,
      factors: factors as {
        emailRisk: number;
        phoneRisk: number;
        ipRisk: number;
        deviceRisk: number;
        amountRisk: number;
        velocityRisk: number;
        [key: string]: number;
      },
      recommendations,
      requiresVerification,
    };
  }

  /**
   * Calculate risk factors
   */
  private async calculateRiskFactors(
    dto: FraudCheckRequestDto,
    companyId: string,
  ): Promise<{
    emailRisk: number;
    phoneRisk: number;
    ipRisk: number;
    deviceRisk: number;
    amountRisk: number;
    velocityRisk: number;
    [key: string]: number;
  }> {
    const factors: {
      emailRisk: number;
      phoneRisk: number;
      ipRisk: number;
      deviceRisk: number;
      amountRisk: number;
      velocityRisk: number;
      [key: string]: number;
    } = {
      emailRisk: 0,
      phoneRisk: 0,
      ipRisk: 0,
      deviceRisk: 0,
      amountRisk: 0,
      velocityRisk: 0,
    };

    // Email risk (0-100)
    factors.emailRisk = this.checkEmailRisk(dto.email);

    // Phone risk (0-100)
    factors.phoneRisk = this.checkPhoneRisk(dto.phone);

    // IP address risk (0-100)
    factors.ipRisk = await this.checkIPRisk(dto.ipAddress, companyId);

    // Device risk (0-100)
    factors.deviceRisk = await this.checkDeviceRisk(dto.deviceFingerprint, dto.email, companyId);

    // Amount risk (0-100)
    if (dto.requestedAmount) {
      factors.amountRisk = this.checkAmountRisk(dto.requestedAmount, dto.email, companyId);
    } else {
      factors.amountRisk = 0;
    }

    // Velocity risk (multiple applications in short time)
    factors.velocityRisk = await this.checkVelocityRisk(dto.email, dto.phone, companyId);

    return factors;
  }

  /**
   * Check email risk
   */
  private checkEmailRisk(email: string): number {
    let risk = 0;

    // Check for disposable email domains
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      risk += 50;
    }

    // Check for suspicious patterns
    if (email.match(/\d{6,}/)) {
      risk += 20; // Many numbers in email
    }

    // Check for common fraud patterns
    if (email.includes('test') || email.includes('fake')) {
      risk += 30;
    }

    return Math.min(100, risk);
  }

  /**
   * Check phone risk
   */
  private checkPhoneRisk(phone: string): number {
    let risk = 0;

    // Check for VOIP numbers (simplified - in production use a service)
    if (phone.startsWith('+1') && phone.length === 12) {
      // US number format check
      // In production, use a service to check if it's a VOIP number
    }

    // Check for suspicious patterns
    if (phone.match(/(\d)\1{5,}/)) {
      risk += 30; // Repeated digits
    }

    return Math.min(100, risk);
  }

  /**
   * Check IP address risk
   */
  private async checkIPRisk(ipAddress: string, companyId: string): Promise<number> {
    let risk = 0;

    // Check for VPN/Proxy (simplified - in production use a service)
    // For now, check for known VPN patterns or use a service like MaxMind

    // Check for multiple applications from same IP
    const recentApps = await this.applicationRepository.count({
      where: {
        companyId,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) as any, // Last 24 hours
      } as any,
    });

    if (recentApps > 10) {
      risk += 40; // High volume from same IP
    }

    // Check for suspicious IP ranges (simplified)
    if (ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
      risk += 20; // Private IP (unusual for customer applications)
    }

    return Math.min(100, risk);
  }

  /**
   * Check device risk
   */
  private async checkDeviceRisk(
    deviceFingerprint: string | undefined,
    email: string,
    companyId: string,
  ): Promise<number> {
    if (!deviceFingerprint) {
      return 10; // Low risk if no fingerprint
    }

    let risk = 0;

    // Check for multiple applications from same device with different emails
    const appsWithDevice = await this.applicationRepository.count({
      where: {
        companyId,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) as any, // Last 7 days
      } as any,
    });

    if (appsWithDevice > 5) {
      risk += 30; // Multiple applications from same device
    }

    return Math.min(100, risk);
  }

  /**
   * Check amount risk
   */
  private checkAmountRisk(
    amount: number,
    email: string,
    companyId: string,
  ): number {
    let risk = 0;

    // Very high amount for first application
    if (amount > 1000000) {
      risk += 40;
    }

    // Round numbers (potential fraud indicator)
    if (amount % 10000 === 0 && amount >= 100000) {
      risk += 10;
    }

    return Math.min(100, risk);
  }

  /**
   * Check velocity risk (multiple applications in short time)
   */
  private async checkVelocityRisk(
    email: string,
    phone: string,
    companyId: string,
  ): Promise<number> {
    // Check for multiple applications with same email/phone in last 24 hours
    const recentApps = await this.applicationRepository.count({
      where: {
        companyId,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) as any, // Last 24 hours
      } as any,
    });

    let risk = 0;
    if (recentApps > 3) {
      risk += 50; // High velocity
    } else if (recentApps > 1) {
      risk += 20; // Moderate velocity
    }

    return Math.min(100, risk);
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(factors: Record<string, number>): number {
    const weights = {
      emailRisk: 0.15,
      phoneRisk: 0.10,
      ipRisk: 0.20,
      deviceRisk: 0.15,
      amountRisk: 0.15,
      velocityRisk: 0.25,
    };

    let totalScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      totalScore += (factors[factor] || 0) * weight;
    }

    return Math.round(totalScore);
  }

  /**
   * Determine risk level
   */
  private determineRiskLevel(riskScore: number): FraudRiskLevel {
    if (riskScore >= 80) {
      return FraudRiskLevel.CRITICAL;
    } else if (riskScore >= 60) {
      return FraudRiskLevel.HIGH;
    } else if (riskScore >= 40) {
      return FraudRiskLevel.MEDIUM;
    } else {
      return FraudRiskLevel.LOW;
    }
  }

  /**
   * Get fraud indicators
   */
  private getFraudIndicators(factors: Record<string, number>, riskScore: number): string[] {
    const indicators: string[] = [];

    if (factors.emailRisk >= 50) {
      indicators.push('Suspicious email address detected');
    }

    if (factors.phoneRisk >= 50) {
      indicators.push('Suspicious phone number detected');
    }

    if (factors.ipRisk >= 50) {
      indicators.push('Suspicious IP address or high volume from same IP');
    }

    if (factors.deviceRisk >= 50) {
      indicators.push('Multiple applications from same device');
    }

    if (factors.velocityRisk >= 50) {
      indicators.push('High application velocity detected');
    }

    if (factors.amountRisk >= 50) {
      indicators.push('Unusual loan amount requested');
    }

    if (indicators.length === 0 && riskScore > 30) {
      indicators.push('Multiple low-risk indicators detected');
    }

    return indicators;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    riskLevel: FraudRiskLevel,
    factors: Record<string, number>,
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === FraudRiskLevel.CRITICAL || riskLevel === FraudRiskLevel.HIGH) {
      recommendations.push('Manual review required');
      recommendations.push('Request additional identity verification');
    }

    if (factors.emailRisk >= 50) {
      recommendations.push('Verify email address with customer');
    }

    if (factors.phoneRisk >= 50) {
      recommendations.push('Verify phone number with customer');
    }

    if (factors.velocityRisk >= 50) {
      recommendations.push('Investigate multiple applications');
    }

    if (riskLevel === FraudRiskLevel.LOW) {
      recommendations.push('Low risk - proceed with standard verification');
    }

    return recommendations;
  }
}

