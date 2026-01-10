import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class FraudCheckRequestDto {
  @ApiProperty({ description: 'Application ID', example: 'uuid' })
  @IsString()
  applicationId: string;

  @ApiProperty({ description: 'Customer email', example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Customer phone', example: '+1234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'IP address', example: '192.168.1.1' })
  @IsString()
  ipAddress: string;

  @ApiPropertyOptional({ description: 'Device fingerprint', example: 'device-hash' })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional({ description: 'Requested amount', example: 100000 })
  @IsOptional()
  @IsNumber()
  requestedAmount?: number;
}

export class FraudCheckResultDto {
  @ApiProperty({ description: 'Risk level', enum: FraudRiskLevel })
  riskLevel: FraudRiskLevel;

  @ApiProperty({ description: 'Risk score (0-100, higher = riskier)', example: 25 })
  riskScore: number;

  @ApiProperty({ description: 'Is flagged as fraud', example: false })
  isFlagged: boolean;

  @ApiProperty({ description: 'Fraud indicators', type: [String] })
  indicators: string[];

  @ApiProperty({ description: 'Risk factors', type: Object })
  factors: {
    emailRisk: number;
    phoneRisk: number;
    ipRisk: number;
    deviceRisk: number;
    amountRisk: number;
    velocityRisk: number;
    [key: string]: number;
  };

  @ApiProperty({ description: 'Recommendations', type: [String] })
  recommendations: string[];

  @ApiProperty({ description: 'Should require additional verification', example: false })
  requiresVerification: boolean;
}

