import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BehavioralAnomalyCheckRequestDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  @IsString()
  applicationId: string;

  @ApiPropertyOptional({ description: 'Application start time', example: '2024-01-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  applicationStartTime?: string;

  @ApiPropertyOptional({ description: 'Application completion time', example: '2024-01-15T10:00:30Z' })
  @IsOptional()
  @IsDateString()
  applicationCompletionTime?: string;

  @ApiPropertyOptional({ description: 'Device location (latitude, longitude)', example: { lat: 40.7128, lng: -74.0060 } })
  @IsOptional()
  @IsObject()
  deviceLocation?: { lat: number; lng: number };

  @ApiPropertyOptional({ description: 'Application address', example: '123 Main St, New York, NY 10001' })
  @IsOptional()
  @IsString()
  applicationAddress?: string;

  @ApiPropertyOptional({ description: 'Device fingerprint', example: 'device-fingerprint-hash' })
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @ApiPropertyOptional({ description: 'User agent', example: 'Mozilla/5.0...' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Usage patterns (clicks, time on fields, etc.)', example: { fieldTime: {}, clickPattern: {} } })
  @IsOptional()
  @IsObject()
  usagePatterns?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Platform identifier', example: 'web' })
  @IsOptional()
  @IsString()
  platform?: string;
}

export class SpeedAnomalyDto {
  @ApiProperty({ description: 'Whether speed anomaly detected', example: true })
  @IsBoolean()
  detected: boolean;

  @ApiProperty({ description: 'Completion time in seconds', example: 30 })
  @IsNumber()
  completionTimeSeconds: number;

  @ApiProperty({ description: 'Threshold in seconds', example: 60 })
  @IsNumber()
  thresholdSeconds: number;

  @ApiProperty({ description: 'Anomaly score (0-100)', example: 85 })
  @IsNumber()
  score: number;
}

export class LocationAnomalyDto {
  @ApiProperty({ description: 'Whether location anomaly detected', example: true })
  @IsBoolean()
  detected: boolean;

  @ApiProperty({ description: 'Device location', example: { lat: 40.7128, lng: -74.0060 } })
  @IsObject()
  deviceLocation?: { lat: number; lng: number };

  @ApiProperty({ description: 'Application address location', example: { lat: 34.0522, lng: -118.2437 } })
  @IsObject()
  addressLocation?: { lat: number; lng: number };

  @ApiProperty({ description: 'Distance in kilometers', example: 3944.5 })
  @IsNumber()
  distanceKm?: number;

  @ApiProperty({ description: 'Anomaly score (0-100)', example: 70 })
  @IsNumber()
  score: number;
}

export class UsagePatternAnomalyDto {
  @ApiProperty({ description: 'Whether usage pattern anomaly detected', example: true })
  @IsBoolean()
  detected: boolean;

  @ApiProperty({ description: 'Pattern type', example: 'FIRST_TIME_ADVANCED_PATTERNS' })
  patternType: string;

  @ApiProperty({ description: 'Anomaly description', example: 'First-time user showing advanced navigation patterns' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Anomaly score (0-100)', example: 65 })
  @IsNumber()
  score: number;
}

export class MultiPlatformAnomalyDto {
  @ApiProperty({ description: 'Whether multi-platform anomaly detected', example: true })
  @IsBoolean()
  detected: boolean;

  @ApiProperty({ description: 'Number of platforms', example: 3 })
  @IsNumber()
  platformCount: number;

  @ApiProperty({ description: 'Platforms used', example: ['web', 'mobile-ios', 'mobile-android'] })
  platforms: string[];

  @ApiProperty({ description: 'Time window in hours', example: 2 })
  @IsNumber()
  timeWindowHours: number;

  @ApiProperty({ description: 'Anomaly score (0-100)', example: 80 })
  @IsNumber()
  score: number;
}

export class BehavioralAnomalyResultDto {
  @ApiProperty({ description: 'Application ID', example: 'app-123' })
  applicationId: string;

  @ApiProperty({ description: 'Speed anomaly analysis', type: SpeedAnomalyDto })
  speedAnomaly: SpeedAnomalyDto;

  @ApiProperty({ description: 'Location anomaly analysis', type: LocationAnomalyDto })
  locationAnomaly: LocationAnomalyDto;

  @ApiProperty({ description: 'Usage pattern anomaly analysis', type: UsagePatternAnomalyDto })
  usagePatternAnomaly: UsagePatternAnomalyDto;

  @ApiProperty({ description: 'Multi-platform anomaly analysis', type: MultiPlatformAnomalyDto })
  multiPlatformAnomaly: MultiPlatformAnomalyDto;

  @ApiProperty({ description: 'Overall anomaly score (0-100)', example: 75 })
  @IsNumber()
  overallAnomalyScore: number;

  @ApiProperty({ description: 'Whether flagged for review (score >70)', example: true })
  @IsBoolean()
  flaggedForReview: boolean;

  @ApiProperty({ description: 'Review threshold', example: 70 })
  @IsNumber()
  reviewThreshold: number;
}

