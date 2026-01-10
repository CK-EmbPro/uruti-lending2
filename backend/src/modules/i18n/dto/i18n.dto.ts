import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum SupportedLanguage {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
  ZH = 'zh',
  JA = 'ja',
  AR = 'ar',
  HI = 'hi',
}

export class TranslateRequestDto {
  @ApiProperty({ description: 'Text to translate', example: 'Welcome to Uruti Lending' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Target language', enum: SupportedLanguage, example: 'es' })
  @IsEnum(SupportedLanguage)
  targetLanguage: SupportedLanguage;

  @ApiPropertyOptional({ description: 'Source language (auto-detect if not provided)', enum: SupportedLanguage })
  @IsOptional()
  @IsEnum(SupportedLanguage)
  sourceLanguage?: SupportedLanguage;

  @ApiPropertyOptional({ description: 'Context', example: 'email_subject' })
  @IsOptional()
  @IsString()
  context?: string;
}

export class TranslationResult {
  @ApiProperty({ description: 'Original text', example: 'Welcome to Uruti Lending' })
  originalText: string;

  @ApiProperty({ description: 'Translated text', example: 'Bienvenido a Uruti Lending' })
  translatedText: string;

  @ApiProperty({ description: 'Source language', example: 'en' })
  sourceLanguage: string;

  @ApiProperty({ description: 'Target language', example: 'es' })
  targetLanguage: string;

  @ApiProperty({ description: 'Confidence score (0-1)', example: 0.95 })
  confidence: number;
}

export class SetUserLanguageDto {
  @ApiProperty({ description: 'Language code', enum: SupportedLanguage, example: 'es' })
  @IsEnum(SupportedLanguage)
  language: SupportedLanguage;
}

export class LanguagePreference {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  userId: string;

  @ApiProperty({ description: 'Preferred language', enum: SupportedLanguage })
  language: SupportedLanguage;

  @ApiProperty({ description: 'Updated at', example: '2024-01-15T10:30:00Z' })
  updatedAt: string;
}

