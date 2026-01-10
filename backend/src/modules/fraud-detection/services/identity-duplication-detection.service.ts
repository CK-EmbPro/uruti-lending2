import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LoanApplication } from '../../loan-application/entities/loan-application.entity';
import { IdentityDuplicationCheck } from '../entities/identity-duplication-check.entity';
import {
  DuplicateCheckRequestDto,
  IdentityDuplicationResultDto,
  DuplicateMatchDto,
  SuspiciousPatternDto,
} from '../dto/identity-duplication.dto';
import * as crypto from 'crypto';

// Simple string similarity function (in production, use a library like string-similarity)
function compareStrings(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

@Injectable()
export class IdentityDuplicationDetectionService {
  private readonly logger = new Logger(IdentityDuplicationDetectionService.name);

  // Thresholds for suspicious patterns
  private readonly SAME_DEVICE_THRESHOLD = 5;
  private readonly SAME_BANK_THRESHOLD = 3;
  private readonly NAME_SIMILARITY_THRESHOLD = 0.85; // 85% similarity for fuzzy matching

  constructor(
    @InjectRepository(LoanApplication)
    private readonly applicationRepository: Repository<LoanApplication>,
    @InjectRepository(IdentityDuplicationCheck)
    private readonly duplicationCheckRepository: Repository<IdentityDuplicationCheck>,
  ) {}

  /**
   * Check for identity duplication across all dimensions
   */
  async checkDuplication(
    dto: DuplicateCheckRequestDto,
    companyId: string,
  ): Promise<IdentityDuplicationResultDto> {
    this.logger.log(`Checking identity duplication for application ${dto.applicationId}`);

    const duplicates: DuplicateMatchDto[] = [];
    const suspiciousPatterns: SuspiciousPatternDto[] = [];

    // Check ID number duplicates
    if (dto.idNumber) {
      const idDuplicates = await this.checkIdNumberDuplicates(dto.idNumber, dto.applicationId, companyId);
      if (idDuplicates.length > 0) {
        duplicates.push({
          matchType: 'ID_NUMBER',
          matchedValue: dto.idNumber,
          matchedApplicationIds: idDuplicates,
          similarityScore: 100,
          isExactMatch: true,
        });
      }

      // Check for ID number variations
      const idVariations = await this.checkIdNumberVariations(dto.idNumber, dto.applicationId, companyId);
      if (idVariations.length > 0) {
        suspiciousPatterns.push({
          patternType: 'ID_NUMBER_VARIATIONS',
          description: `Found ${idVariations.length} ID number variations`,
          count: idVariations.length,
          threshold: 1,
          relatedApplicationIds: idVariations,
        });
      }
    }

    // Check phone number duplicates
    if (dto.phoneNumber) {
      const phoneDuplicates = await this.checkPhoneDuplicates(dto.phoneNumber, dto.applicationId, companyId);
      if (phoneDuplicates.length > 0) {
        duplicates.push({
          matchType: 'PHONE',
          matchedValue: dto.phoneNumber,
          matchedApplicationIds: phoneDuplicates,
          similarityScore: 100,
          isExactMatch: true,
        });
      }
    }

    // Check email duplicates
    if (dto.email) {
      const emailDuplicates = await this.checkEmailDuplicates(dto.email, dto.applicationId, companyId);
      if (emailDuplicates.length > 0) {
        duplicates.push({
          matchType: 'EMAIL',
          matchedValue: dto.email,
          matchedApplicationIds: emailDuplicates,
          similarityScore: 100,
          isExactMatch: true,
        });
      }
    }

    // Check device fingerprint duplicates
    if (dto.deviceFingerprint) {
      const deviceDuplicates = await this.checkDeviceDuplicates(dto.deviceFingerprint, dto.applicationId, companyId);
      if (deviceDuplicates.length > 0) {
        duplicates.push({
          matchType: 'DEVICE',
          matchedValue: dto.deviceFingerprint,
          matchedApplicationIds: deviceDuplicates,
          similarityScore: 100,
          isExactMatch: true,
        });

        // Check for same device multiple accounts pattern
        if (deviceDuplicates.length >= this.SAME_DEVICE_THRESHOLD) {
          suspiciousPatterns.push({
            patternType: 'SAME_DEVICE_MULTIPLE_ACCOUNTS',
            description: `Same device used for ${deviceDuplicates.length + 1} accounts`,
            count: deviceDuplicates.length + 1,
            threshold: this.SAME_DEVICE_THRESHOLD,
            relatedApplicationIds: [dto.applicationId, ...deviceDuplicates],
          });
        }
      }
    }

    // Check biometric hash duplicates
    if (dto.biometricHash) {
      const biometricDuplicates = await this.checkBiometricDuplicates(
        dto.biometricHash,
        dto.applicationId,
        companyId,
      );
      if (biometricDuplicates.length > 0) {
        duplicates.push({
          matchType: 'BIOMETRIC',
          matchedValue: dto.biometricHash,
          matchedApplicationIds: biometricDuplicates,
          similarityScore: 100,
          isExactMatch: true,
        });
      }
    }

    // Check bank account duplicates
    if (dto.bankAccountNumber) {
      const bankDuplicates = await this.checkBankAccountDuplicates(
        dto.bankAccountNumber,
        dto.applicationId,
        companyId,
      );
      if (bankDuplicates.length > 0) {
        duplicates.push({
          matchType: 'BANK_ACCOUNT',
          matchedValue: dto.bankAccountNumber,
          matchedApplicationIds: bankDuplicates,
          similarityScore: 100,
          isExactMatch: true,
        });

        // Check for same bank multiple accounts pattern
        if (bankDuplicates.length >= this.SAME_BANK_THRESHOLD) {
          suspiciousPatterns.push({
            patternType: 'SAME_BANK_MULTIPLE_ACCOUNTS',
            description: `Same bank account used for ${bankDuplicates.length + 1} accounts`,
            count: bankDuplicates.length + 1,
            threshold: this.SAME_BANK_THRESHOLD,
            relatedApplicationIds: [dto.applicationId, ...bankDuplicates],
          });
        }
      }
    }

    // Check fuzzy name matching
    if (dto.fullName) {
      const nameMatches = await this.checkFuzzyNameMatch(dto.fullName, dto.applicationId, companyId);
      if (nameMatches.length > 0) {
        nameMatches.forEach((match) => {
          duplicates.push({
            matchType: 'NAME_FUZZY',
            matchedValue: match.name,
            matchedApplicationIds: [match.applicationId],
            similarityScore: match.similarity * 100,
            isExactMatch: match.similarity === 1.0,
          });
        });
      }
    }

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(duplicates, suspiciousPatterns);
    const flaggedForReview = riskScore >= 50 || duplicates.length > 0 || suspiciousPatterns.length > 0;

    // Save check result
    const checkRecord = this.duplicationCheckRepository.create({
      applicationId: dto.applicationId,
      idNumber: dto.idNumber,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      deviceFingerprint: dto.deviceFingerprint,
      biometricHash: dto.biometricHash,
      bankAccountNumber: dto.bankAccountNumber,
      fullName: dto.fullName,
      duplicates,
      suspiciousPatterns,
      riskScore,
      flaggedForReview,
    });
    await this.duplicationCheckRepository.save(checkRecord);

    return {
      applicationId: dto.applicationId,
      hasDuplicates: duplicates.length > 0,
      duplicates,
      suspiciousPatterns,
      riskScore,
      flaggedForReview,
    };
  }

  /**
   * Check for ID number duplicates
   */
  private async checkIdNumberDuplicates(
    idNumber: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const normalizedId = this.normalizeIdNumber(idNumber);
    const checks = await this.duplicationCheckRepository.find({
      where: { idNumber: normalizedId },
      select: ['applicationId'],
    });

    const applicationIds = checks
      .map((check) => check.applicationId)
      .filter((id) => id !== currentApplicationId);

    return [...new Set(applicationIds)];
  }

  /**
   * Check for ID number variations (similar but not exact)
   */
  private async checkIdNumberVariations(
    idNumber: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const normalizedId = this.normalizeIdNumber(idNumber);
    const allChecks = await this.duplicationCheckRepository.find({
      select: ['applicationId', 'idNumber'],
    });

    const variations: string[] = [];
    for (const check of allChecks) {
      if (check.idNumber && check.applicationId !== currentApplicationId) {
        const similarity = compareStrings(normalizedId, this.normalizeIdNumber(check.idNumber));
        if (similarity >= 0.8 && similarity < 1.0) {
          variations.push(check.applicationId);
        }
      }
    }

    return [...new Set(variations)];
  }

  /**
   * Check for phone number duplicates
   */
  private async checkPhoneDuplicates(
    phoneNumber: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const checks = await this.duplicationCheckRepository.find({
      where: { phoneNumber: normalizedPhone },
      select: ['applicationId'],
    });

    return checks
      .map((check) => check.applicationId)
      .filter((id) => id !== currentApplicationId);
  }

  /**
   * Check for email duplicates
   */
  private async checkEmailDuplicates(
    email: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const normalizedEmail = email.toLowerCase().trim();
    const checks = await this.duplicationCheckRepository.find({
      where: { email: normalizedEmail },
      select: ['applicationId'],
    });

    return checks
      .map((check) => check.applicationId)
      .filter((id) => id !== currentApplicationId);
  }

  /**
   * Check for device fingerprint duplicates
   */
  private async checkDeviceDuplicates(
    deviceFingerprint: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const checks = await this.duplicationCheckRepository.find({
      where: { deviceFingerprint },
      select: ['applicationId'],
    });

    return checks
      .map((check) => check.applicationId)
      .filter((id) => id !== currentApplicationId);
  }

  /**
   * Check for biometric hash duplicates
   */
  private async checkBiometricDuplicates(
    biometricHash: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const checks = await this.duplicationCheckRepository.find({
      where: { biometricHash },
      select: ['applicationId'],
    });

    return checks
      .map((check) => check.applicationId)
      .filter((id) => id !== currentApplicationId);
  }

  /**
   * Check for bank account duplicates
   */
  private async checkBankAccountDuplicates(
    bankAccountNumber: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<string[]> {
    const normalizedAccount = this.normalizeBankAccount(bankAccountNumber);
    const checks = await this.duplicationCheckRepository.find({
      where: { bankAccountNumber: normalizedAccount },
      select: ['applicationId'],
    });

    return checks
      .map((check) => check.applicationId)
      .filter((id) => id !== currentApplicationId);
  }

  /**
   * Check for fuzzy name matches
   */
  private async checkFuzzyNameMatch(
    fullName: string,
    currentApplicationId: string,
    companyId: string,
  ): Promise<Array<{ applicationId: string; name: string; similarity: number }>> {
    const normalizedName = this.normalizeName(fullName);
    const checks = await this.duplicationCheckRepository.find({
      where: { fullName: In([normalizedName]) },
      select: ['applicationId', 'fullName'],
    });

    const matches: Array<{ applicationId: string; name: string; similarity: number }> = [];

    // Also check all names for fuzzy matching
    const allChecks = await this.duplicationCheckRepository.find({
      select: ['applicationId', 'fullName'],
    });

    for (const check of allChecks) {
      if (check.fullName && check.applicationId !== currentApplicationId) {
        const similarity = compareStrings(
          normalizedName,
          this.normalizeName(check.fullName),
        );
        if (similarity >= this.NAME_SIMILARITY_THRESHOLD) {
          matches.push({
            applicationId: check.applicationId,
            name: check.fullName,
            similarity,
          });
        }
      }
    }

    return matches;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(duplicates: DuplicateMatchDto[], suspiciousPatterns: SuspiciousPatternDto[]): number {
    let score = 0;

    // Each duplicate adds to risk
    duplicates.forEach((dup) => {
      if (dup.isExactMatch) {
        score += 30; // Exact match is high risk
      } else {
        score += dup.similarityScore * 0.3; // Fuzzy match weighted by similarity
      }
    });

    // Suspicious patterns add significant risk
    suspiciousPatterns.forEach((pattern) => {
      if (pattern.patternType === 'SAME_DEVICE_MULTIPLE_ACCOUNTS') {
        score += 40;
      } else if (pattern.patternType === 'SAME_BANK_MULTIPLE_ACCOUNTS') {
        score += 35;
      } else if (pattern.patternType === 'ID_NUMBER_VARIATIONS') {
        score += 25;
      }
    });

    return Math.min(100, score);
  }

  /**
   * Normalize ID number (remove spaces, dashes, etc.)
   */
  private normalizeIdNumber(idNumber: string): string {
    return idNumber.replace(/[\s\-_]/g, '').toUpperCase();
  }

  /**
   * Normalize phone number
   */
  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\(\)\+]/g, '');
  }

  /**
   * Normalize bank account number
   */
  private normalizeBankAccount(account: string): string {
    return account.replace(/[\s\-]/g, '');
  }

  /**
   * Normalize name for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }
}

