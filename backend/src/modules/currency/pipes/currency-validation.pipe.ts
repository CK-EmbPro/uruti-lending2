import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CurrencyConversionService } from '../services/currency-conversion.service';

/**
 * Currency Validation Pipe
 * Validates currency IDs in DTOs
 */
@Injectable()
export class CurrencyValidationPipe implements PipeTransform {
  constructor(private readonly currencyConversionService: CurrencyConversionService) {}

  async transform(value: any) {
    // Validate currencyId if present
    if (value.currencyId) {
      const isValid = await this.currencyConversionService.validateCurrency(value.currencyId);
      if (!isValid) {
        throw new BadRequestException(`Invalid currency: ${value.currencyId}`);
      }
    }

    // Validate paymentCurrencyId if present
    if (value.paymentCurrencyId) {
      const isValid = await this.currencyConversionService.validateCurrency(value.paymentCurrencyId);
      if (!isValid) {
        throw new BadRequestException(`Invalid payment currency: ${value.paymentCurrencyId}`);
      }
    }

    return value;
  }
}

