import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class WeightedScoringRequestDto {
  @ApiProperty({ description: 'Applicant ID' })
  @IsString()
  applicantId: string;

  @ApiPropertyOptional({ description: 'Application ID' })
  @IsString()
  @IsOptional()
  applicationId?: string;

  @ApiPropertyOptional({ description: 'Credit bureau data (if already available)' })
  @IsObject()
  @IsOptional()
  creditBureauData?: any;

  @ApiPropertyOptional({ description: 'Bank account transaction data' })
  @IsObject()
  @IsOptional()
  bankAccountData?: {
    transactions: Array<{
      date: string;
      amount: number;
      category?: string;
      description?: string;
    }>;
  };

  @ApiPropertyOptional({ description: 'Utility and telecom payment data' })
  @IsObject()
  @IsOptional()
  utilityTelecomData?: {
    payments: Array<{
      date: string;
      amount: number;
      daysLate?: number;
      utilityType?: string;
    }>;
    accounts?: Array<{
      startDate: string;
      type: string;
    }>;
  };

  @ApiPropertyOptional({ description: 'Rent payment history' })
  @IsObject()
  @IsOptional()
  rentPaymentData?: {
    payments: Array<{
      date: string;
      amount: number;
      daysLate?: number;
    }>;
    verified?: boolean;
    partial?: boolean;
  };

  @ApiPropertyOptional({ description: 'Behavioral biometrics data' })
  @IsObject()
  @IsOptional()
  behavioralData?: {
    completionRate?: number;
    typingConsistency?: number;
    typingSpeed?: number;
    authentic?: boolean;
    suspicious?: boolean;
    timeSpentSeconds?: number;
  };

  @ApiPropertyOptional({ description: 'Digital footprint data (requires consent)' })
  @IsObject()
  @IsOptional()
  digitalFootprintData?: {
    consent: boolean;
    professionalStrength?: number;
    presenceStability?: number;
    educationVerified?: boolean;
    educationPartial?: boolean;
  };

  @ApiPropertyOptional({ description: 'Transactional intelligence data' })
  @IsObject()
  @IsOptional()
  transactionalData?: {
    transactions?: Array<{
      merchantCategory?: string;
      timeOfDay?: string;
      location?: string;
    }>;
    timeConsistency?: number;
    geographicConsistency?: number;
  };

  @ApiPropertyOptional({ description: 'Enable ML-enhanced scoring', default: true })
  @IsBoolean()
  @IsOptional()
  useML?: boolean;

  @ApiPropertyOptional({ 
    description: 'Customer segment for segment-specific weighting',
    enum: ['MICRO', 'SME', 'ENTERPRISE'],
    default: 'SME'
  })
  @IsString()
  @IsOptional()
  segment?: 'MICRO' | 'SME' | 'ENTERPRISE';
}

export class WeightedScoringResultDto {
  @ApiProperty({ description: 'Final weighted credit score (300-850)' })
  finalScore: number;

  @ApiProperty({ description: 'Score breakdown by category' })
  scoreBreakdown: {
    traditional: {
      score: number;
      breakdown: {
        paymentHistory: number;
        creditUtilization: number;
        publicRecords: number;
      };
      creditReport: { creditScore: number; provider: string } | null;
      confidence: number;
    };
    alternative: {
      score: number;
      breakdown: {
        bankAccount: {
          score: number;
          confidence: number;
          aiInsights: {
            cashFlowPatterns: any;
            incomeStability: any;
            spendingBehavior: any;
          };
        };
        utilityTelecom: {
          score: number;
          confidence: number;
          aiInsights: any;
        };
        rentPayment: {
          score: number;
          confidence: number;
          aiInsights: any;
        };
      };
      confidence: number;
    };
    behavioral: {
      score: number;
      breakdown: {
        deviceBiometrics: {
          score: number;
          confidence: number;
          insights: any;
        };
        digitalFootprint: {
          score: number;
          confidence: number;
          insights: any;
        };
        transactionalIntelligence: {
          score: number;
          confidence: number;
          insights: any;
        };
      };
      confidence: number;
    };
  };

  @ApiProperty({ description: 'Weights used for scoring' })
  weights: {
    TRADITIONAL_BUREAU: number;
    ALTERNATIVE_FINANCIAL: number;
    BEHAVIORAL_DIGITAL: number;
  };

  @ApiPropertyOptional({ description: 'Segment used for scoring', enum: ['MICRO', 'SME', 'ENTERPRISE'] })
  segment?: 'MICRO' | 'SME' | 'ENTERPRISE';

  @ApiProperty({ description: 'Human-readable explanation' })
  explanation: string;

  @ApiProperty({ description: 'Overall confidence score (0-1)' })
  confidence: number;

  @ApiProperty({ description: 'Risk tier assignment', enum: ['PRIME', 'STANDARD', 'MONITORED', 'HIGH_RISK'] })
  riskTier: 'PRIME' | 'STANDARD' | 'MONITORED' | 'HIGH_RISK';

  @ApiProperty({ description: 'Processing time in milliseconds' })
  processingTimeMs: number;

  @ApiProperty({ description: 'Calculation timestamp' })
  calculatedAt: Date;

  @ApiPropertyOptional({ description: 'ML-enhanced score details (if ML was used)' })
  mlScore?: {
    score: number;
    confidence: number;
    featureImportance: Record<string, number>;
    riskFactors: string[];
    modelVersion: string;
    shapValues?: Record<string, number>;
    limeExplanation?: string;
  };
}

export class WeightedScoringRequest {
  applicantId: string;
  applicationId?: string;
  creditBureauData?: any;
  bankAccountData?: any;
  utilityTelecomData?: any;
  rentPaymentData?: any;
  behavioralData?: any;
  digitalFootprintData?: any;
  transactionalData?: any;
}

export interface WeightedScoringResult {
  finalScore: number;
  scoreBreakdown: {
    traditional: any;
    alternative: any;
    behavioral: any;
  };
  weights: {
    TRADITIONAL_BUREAU: number;
    ALTERNATIVE_FINANCIAL: number;
    BEHAVIORAL_DIGITAL: number;
  };
  segment?: 'MICRO' | 'SME' | 'ENTERPRISE';
  explanation: string;
  confidence: number;
  riskTier: 'PRIME' | 'STANDARD' | 'MONITORED' | 'HIGH_RISK';
  processingTimeMs: number;
  calculatedAt: Date;
  mlScore?: {
    score: number;
    confidence: number;
    featureImportance: Record<string, number>;
    riskFactors: string[];
    modelVersion: string;
    shapValues?: Record<string, number>;
    limeExplanation?: string;
  };
}

