import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  BehavioralAnomalyCheckRequestDto,
  BehavioralAnomalyResultDto,
  SpeedAnomalyDto,
  LocationAnomalyDto,
  UsagePatternAnomalyDto,
  MultiPlatformAnomalyDto,
} from '../dto/behavioral-anomaly.dto';
import { BehavioralAnomalyCheck } from '../entities/behavioral-anomaly-check.entity';
import { IdentityDuplicationCheck } from '../entities/identity-duplication-check.entity';

@Injectable()
export class BehavioralAnomalyDetectionService {
  private readonly logger = new Logger(BehavioralAnomalyDetectionService.name);

  // Thresholds
  private readonly SPEED_THRESHOLD_SECONDS = 60; // 1 minute
  private readonly LOCATION_DISTANCE_THRESHOLD_KM = 100; // 100km
  private readonly REVIEW_THRESHOLD = 70; // Score >70 triggers review

  constructor(
    @InjectRepository(BehavioralAnomalyCheck)
    private readonly anomalyCheckRepository: Repository<BehavioralAnomalyCheck>,
    @InjectRepository(IdentityDuplicationCheck)
    private readonly duplicationCheckRepository: Repository<IdentityDuplicationCheck>,
  ) {}

  /**
   * Check for behavioral anomalies
   */
  async checkBehavioralAnomalies(
    dto: BehavioralAnomalyCheckRequestDto,
  ): Promise<BehavioralAnomalyResultDto> {
    this.logger.log(`Checking behavioral anomalies for application ${dto.applicationId}`);

    // Perform all anomaly checks
    const [speedAnomaly, locationAnomaly, usagePatternAnomaly, multiPlatformAnomaly] = await Promise.all([
      this.checkSpeedAnomaly(dto),
      this.checkLocationAnomaly(dto),
      this.checkUsagePatternAnomaly(dto),
      this.checkMultiPlatformAnomaly(dto),
    ]);

    // Calculate overall anomaly score
    const overallAnomalyScore = this.calculateOverallAnomalyScore(
      speedAnomaly,
      locationAnomaly,
      usagePatternAnomaly,
      multiPlatformAnomaly,
    );

    const flaggedForReview = overallAnomalyScore > this.REVIEW_THRESHOLD;

    // Save check result
    const checkRecord = this.anomalyCheckRepository.create({
      applicationId: dto.applicationId,
      speedAnomaly,
      locationAnomaly,
      usagePatternAnomaly,
      multiPlatformAnomaly,
      overallAnomalyScore,
      flaggedForReview,
      reviewThreshold: this.REVIEW_THRESHOLD,
      deviceFingerprint: dto.deviceFingerprint,
      platform: dto.platform,
    });
    await this.anomalyCheckRepository.save(checkRecord);

    return {
      applicationId: dto.applicationId,
      speedAnomaly,
      locationAnomaly,
      usagePatternAnomaly,
      multiPlatformAnomaly,
      overallAnomalyScore,
      flaggedForReview,
      reviewThreshold: this.REVIEW_THRESHOLD,
    };
  }

  /**
   * Check for speed anomalies (completion in <1 minute)
   */
  private async checkSpeedAnomaly(dto: BehavioralAnomalyCheckRequestDto): Promise<SpeedAnomalyDto> {
    if (!dto.applicationStartTime || !dto.applicationCompletionTime) {
      return {
        detected: false,
        completionTimeSeconds: 0,
        thresholdSeconds: this.SPEED_THRESHOLD_SECONDS,
        score: 0,
      };
    }

    const startTime = new Date(dto.applicationStartTime).getTime();
    const completionTime = new Date(dto.applicationCompletionTime).getTime();
    const completionTimeSeconds = Math.round((completionTime - startTime) / 1000);

    const detected = completionTimeSeconds < this.SPEED_THRESHOLD_SECONDS;

    // Calculate score: faster = higher score
    const score = detected
      ? Math.min(100, Math.round(((this.SPEED_THRESHOLD_SECONDS - completionTimeSeconds) / this.SPEED_THRESHOLD_SECONDS) * 100))
      : 0;

    return {
      detected,
      completionTimeSeconds,
      thresholdSeconds: this.SPEED_THRESHOLD_SECONDS,
      score,
    };
  }

  /**
   * Check for location anomalies (device location vs address mismatch)
   */
  private async checkLocationAnomaly(dto: BehavioralAnomalyCheckRequestDto): Promise<LocationAnomalyDto> {
    if (!dto.deviceLocation || !dto.applicationAddress) {
      return {
        detected: false,
        score: 0,
      };
    }

    // In production, geocode the address to get coordinates
    // For now, we'll simulate by checking if coordinates are provided
    const addressLocation = await this.geocodeAddress(dto.applicationAddress);

    if (!addressLocation) {
      return {
        detected: false,
        deviceLocation: dto.deviceLocation,
        score: 0,
      };
    }

    const distanceKm = this.calculateDistance(dto.deviceLocation, addressLocation);
    const detected = distanceKm > this.LOCATION_DISTANCE_THRESHOLD_KM;

    // Calculate score based on distance
    const score = detected
      ? Math.min(100, Math.round((distanceKm / this.LOCATION_DISTANCE_THRESHOLD_KM) * 50))
      : 0;

    return {
      detected,
      deviceLocation: dto.deviceLocation,
      addressLocation,
      distanceKm,
      score,
    };
  }

  /**
   * Check for usage pattern anomalies
   */
  private async checkUsagePatternAnomaly(
    dto: BehavioralAnomalyCheckRequestDto,
  ): Promise<UsagePatternAnomalyDto> {
    if (!dto.usagePatterns) {
      return {
        detected: false,
        patternType: '',
        description: '',
        score: 0,
      };
    }

    // Check if this is a first-time user with advanced patterns
    const isFirstTime = !dto.deviceFingerprint || (await this.isFirstTimeUser(dto.deviceFingerprint));
    const hasAdvancedPatterns = this.detectAdvancedPatterns(dto.usagePatterns);

    if (isFirstTime && hasAdvancedPatterns) {
      return {
        detected: true,
        patternType: 'FIRST_TIME_ADVANCED_PATTERNS',
        description: 'First-time user showing advanced navigation patterns (suspicious bot behavior)',
        score: 65,
      };
    }

    // Check for other suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(dto.usagePatterns);
    if (suspiciousPatterns.length > 0) {
      return {
        detected: true,
        patternType: suspiciousPatterns[0].type,
        description: suspiciousPatterns[0].description,
        score: suspiciousPatterns[0].score,
      };
    }

    return {
      detected: false,
      patternType: '',
      description: '',
      score: 0,
    };
  }

  /**
   * Check for multi-platform anomalies
   */
  private async checkMultiPlatformAnomaly(
    dto: BehavioralAnomalyCheckRequestDto,
  ): Promise<MultiPlatformAnomalyDto> {
    if (!dto.deviceFingerprint) {
      return {
        detected: false,
        platformCount: 0,
        platforms: [],
        timeWindowHours: 0,
        score: 0,
      };
    }

    // Find all applications from same device in last 24 hours
    const timeWindowHours = 24;
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - timeWindowHours);

    const recentChecks = await this.duplicationCheckRepository.find({
      where: {
        deviceFingerprint: dto.deviceFingerprint,
        createdAt: MoreThan(cutoffTime), // Created after cutoff time (within last 24 hours)
      },
      select: ['applicationId', 'createdAt'],
    });

    // Get platforms for these applications
    const platformChecks = await this.anomalyCheckRepository.find({
      where: {
        deviceFingerprint: dto.deviceFingerprint,
        createdAt: MoreThan(cutoffTime), // Created after cutoff time (within last 24 hours)
      },
      select: ['platform', 'createdAt'],
    });

    const platforms = new Set<string>();
    platformChecks.forEach((check) => {
      if (check.platform) platforms.add(check.platform);
    });
    if (dto.platform) platforms.add(dto.platform);

    const platformCount = platforms.size;
    const detected = platformCount >= 2; // Multiple platforms in short time

    // Calculate score
    const score = detected ? Math.min(100, platformCount * 30) : 0;

    return {
      detected,
      platformCount,
      platforms: Array.from(platforms),
      timeWindowHours,
      score,
    };
  }

  /**
   * Calculate overall anomaly score
   */
  private calculateOverallAnomalyScore(
    speedAnomaly: SpeedAnomalyDto,
    locationAnomaly: LocationAnomalyDto,
    usagePatternAnomaly: UsagePatternAnomalyDto,
    multiPlatformAnomaly: MultiPlatformAnomalyDto,
  ): number {
    // Weighted combination
    const weights = {
      speed: 0.25,
      location: 0.25,
      usagePattern: 0.30,
      multiPlatform: 0.20,
    };

    const score =
      speedAnomaly.score * weights.speed +
      locationAnomaly.score * weights.location +
      usagePatternAnomaly.score * weights.usagePattern +
      multiPlatformAnomaly.score * weights.multiPlatform;

    return Math.min(100, Math.round(score));
  }

  /**
   * Geocode address to coordinates (simplified - in production use a geocoding service)
   */
  private async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    // In production, use a geocoding API like Google Maps, Mapbox, etc.
    // For now, return null (simulating that geocoding is not available)
    // In a real implementation, you would call a geocoding service
    return null;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(
    coord1: { lat: number; lng: number },
    coord2: { lat: number; lng: number },
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) *
        Math.cos(this.deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if user is first-time
   */
  private async isFirstTimeUser(deviceFingerprint: string): Promise<boolean> {
    const existingChecks = await this.duplicationCheckRepository.count({
      where: { deviceFingerprint },
    });
    return existingChecks === 0;
  }

  /**
   * Detect advanced patterns (suspicious for first-time users)
   */
  private detectAdvancedPatterns(usagePatterns: Record<string, any>): boolean {
    // Check for patterns that suggest automation:
    // - Very fast field navigation
    // - No hesitation on complex fields
    // - Perfect form completion
    const fieldTime = usagePatterns.fieldTime || {};
    const clickPattern = usagePatterns.clickPattern || {};

    // If all fields completed very quickly (<2 seconds each), suspicious
    const fieldTimeValues = Object.values(fieldTime) as number[];
    const avgFieldTime = fieldTimeValues.length > 0 
      ? fieldTimeValues.reduce((sum: number, time: number) => sum + (time || 0), 0) / fieldTimeValues.length 
      : 0;
    if (avgFieldTime < 2 && Object.keys(fieldTime).length > 5) {
      return true;
    }

    // If no backspaces or corrections, suspicious
    if (clickPattern.totalClicks && clickPattern.backspaces === 0 && clickPattern.totalClicks > 20) {
      return true;
    }

    return false;
  }

  /**
   * Detect other suspicious patterns
   */
  private detectSuspiciousPatterns(usagePatterns: Record<string, any>): Array<{ type: string; description: string; score: number }> {
    const patterns: Array<{ type: string; description: string; score: number }> = [];

    // Pattern: Unusually fast typing
    const typingSpeed = usagePatterns.typingSpeed;
    if (typingSpeed && typingSpeed > 200) { // >200 WPM is suspicious
      patterns.push({
        type: 'UNUSUALLY_FAST_TYPING',
        description: `Typing speed of ${typingSpeed} WPM is suspiciously fast`,
        score: 70,
      });
    }

    // Pattern: No mouse movement
    const mouseMovements = usagePatterns.mouseMovements || 0;
    if (mouseMovements === 0 && usagePatterns.totalClicks > 10) {
      patterns.push({
        type: 'NO_MOUSE_MOVEMENT',
        description: 'No mouse movements detected despite multiple clicks (possible automation)',
        score: 60,
      });
    }

    return patterns;
  }
}

