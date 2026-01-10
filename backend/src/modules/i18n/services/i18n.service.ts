import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguagePreference, SupportedLanguage } from '../entities/language-preference.entity';
import {
  TranslateRequestDto,
  TranslationResult,
  SetUserLanguageDto,
  LanguagePreference as LanguagePreferenceDto,
} from '../dto/i18n.dto';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);

  // Translation dictionary (simplified - in production would use translation service)
  private readonly translations: Record<string, Record<string, string>> = {
    'Welcome to Uruti Lending': {
      es: 'Bienvenido a Uruti Lending',
      fr: 'Bienvenue chez Uruti Lending',
      de: 'Willkommen bei Uruti Lending',
      it: 'Benvenuto in Uruti Lending',
      pt: 'Bem-vindo ao Uruti Lending',
      zh: '欢迎使用 Uruti Lending',
      ja: 'Uruti Lendingへようこそ',
      ar: 'مرحباً بك في Uruti Lending',
      hi: 'Uruti Lending में आपका स्वागत है',
    },
    'Loan Application': {
      es: 'Solicitud de Préstamo',
      fr: 'Demande de Prêt',
      de: 'Kreditantrag',
      it: 'Domanda di Prestito',
      pt: 'Solicitação de Empréstimo',
      zh: '贷款申请',
      ja: 'ローン申請',
      ar: 'طلب القرض',
      hi: 'ऋण आवेदन',
    },
    'Payment Due': {
      es: 'Pago Vencido',
      fr: 'Paiement Dû',
      de: 'Fällige Zahlung',
      it: 'Pagamento Dovuto',
      pt: 'Pagamento Devido',
      zh: '到期付款',
      ja: '支払期日',
      ar: 'الدفع المستحق',
      hi: 'भुगतान देय',
    },
  };

  constructor(
    @InjectRepository(LanguagePreference)
    private readonly preferenceRepository: Repository<LanguagePreference>,
  ) {}

  /**
   * Translate text
   */
  async translate(dto: TranslateRequestDto): Promise<TranslationResult> {
    this.logger.log(`Translating text to ${dto.targetLanguage}`);

    // Detect source language if not provided
    const sourceLanguage = dto.sourceLanguage || this.detectLanguage(dto.text);

    // Get translation
    const translatedText = this.getTranslation(dto.text, dto.targetLanguage, dto.context);

    return {
      originalText: dto.text,
      translatedText,
      sourceLanguage,
      targetLanguage: dto.targetLanguage,
      confidence: 0.9, // Simplified confidence score
    };
  }

  /**
   * Set user language preference
   */
  async setUserLanguage(
    userId: string,
    companyId: string,
    dto: SetUserLanguageDto,
  ): Promise<LanguagePreferenceDto> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId, companyId },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        companyId,
        language: dto.language,
      });
    } else {
      preference.language = dto.language;
    }

    const saved = await this.preferenceRepository.save(preference);

    return {
      userId: saved.userId,
      language: saved.language,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  /**
   * Get user language preference
   */
  async getUserLanguage(
    userId: string,
    companyId: string,
  ): Promise<SupportedLanguage> {
    const preference = await this.preferenceRepository.findOne({
      where: { userId, companyId },
    });

    return preference?.language || SupportedLanguage.EN;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    ];
  }

  // Private helper methods

  private detectLanguage(text: string): SupportedLanguage {
    // Simplified language detection
    // In production, would use a language detection library
    return SupportedLanguage.EN;
  }

  private getTranslation(
    text: string,
    targetLanguage: SupportedLanguage,
    context?: string,
  ): string {
    // Check if translation exists in dictionary
    if (this.translations[text] && this.translations[text][targetLanguage]) {
      return this.translations[text][targetLanguage];
    }

    // In production, would call translation service (Google Translate, DeepL, etc.)
    // For now, return original text with note
    return `[${targetLanguage.toUpperCase()}] ${text}`;
  }
}

