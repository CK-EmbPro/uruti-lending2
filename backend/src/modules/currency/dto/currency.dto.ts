import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsObject,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { CurrencyStatus } from '../entities/currency.entity';
import { ExchangeRateSource } from '../entities/exchange-rate.entity';
import { FXTransactionType } from '../entities/fx-transaction.entity';
import { ExposureType } from '../entities/fx-exposure.entity';

export class CreateCurrencyDto {
  @ApiProperty({ description: 'ISO 4217 currency code (e.g., USD, EUR, GBP)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Full currency name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Currency symbol' })
  @IsString()
  @IsOptional()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Number of decimal places', default: 2 })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  decimalPlaces?: number;

  @ApiPropertyOptional({ description: 'Is base currency', default: false })
  @IsBoolean()
  @IsOptional()
  isBaseCurrency?: boolean;

  @ApiPropertyOptional({ description: 'Initial exchange rate to base currency' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  exchangeRate?: number;
}

export class CreateExchangeRateDto {
  @ApiProperty({ description: 'From currency ID' })
  @IsUUID()
  fromCurrencyId: string;

  @ApiProperty({ description: 'To currency ID' })
  @IsUUID()
  toCurrencyId: string;

  @ApiProperty({ description: 'Exchange rate (1 fromCurrency = rate toCurrency)' })
  @IsNumber()
  @Min(0.000001)
  rate: number;

  @ApiProperty({ description: 'Rate date (YYYY-MM-DD)' })
  @IsDateString()
  rateDate: string;

  @ApiPropertyOptional({ description: 'Rate source', enum: ExchangeRateSource })
  @IsEnum(ExchangeRateSource)
  @IsOptional()
  source?: ExchangeRateSource;

  @ApiPropertyOptional({ description: 'Source reference' })
  @IsString()
  @IsOptional()
  sourceReference?: string;

  @ApiPropertyOptional({ description: 'Buy rate' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  buyRate?: number;

  @ApiPropertyOptional({ description: 'Sell rate' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellRate?: number;
}

export class ConvertCurrencyDto {
  @ApiProperty({ description: 'From currency ID' })
  @IsUUID()
  fromCurrencyId: string;

  @ApiProperty({ description: 'To currency ID' })
  @IsUUID()
  toCurrencyId: string;

  @ApiProperty({ description: 'Amount to convert' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Exchange rate date (YYYY-MM-DD). If not provided, uses latest rate' })
  @IsDateString()
  @IsOptional()
  rateDate?: string;

  @ApiPropertyOptional({ description: 'Use buy/sell rate', default: false })
  @IsBoolean()
  @IsOptional()
  useBuySellRate?: boolean;
}

export class CreateFXTransactionDto {
  @ApiPropertyOptional({ description: 'Loan ID' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiProperty({ description: 'Transaction type', enum: FXTransactionType })
  @IsEnum(FXTransactionType)
  transactionType: FXTransactionType;

  @ApiProperty({ description: 'From currency ID' })
  @IsUUID()
  fromCurrencyId: string;

  @ApiProperty({ description: 'To currency ID' })
  @IsUUID()
  toCurrencyId: string;

  @ApiProperty({ description: 'Amount in from currency' })
  @IsNumber()
  @Min(0.01)
  fromAmount: number;

  @ApiProperty({ description: 'Exchange rate' })
  @IsNumber()
  @Min(0.000001)
  exchangeRate: number;

  @ApiProperty({ description: 'Transaction date (YYYY-MM-DD)' })
  @IsDateString()
  transactionDate: string;

  @ApiPropertyOptional({ description: 'Value date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  valueDate?: string;

  @ApiPropertyOptional({ description: 'Reference' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class GetExchangeRatesDto {
  @ApiPropertyOptional({ description: 'From currency ID' })
  @IsUUID()
  @IsOptional()
  fromCurrencyId?: string;

  @ApiPropertyOptional({ description: 'To currency ID' })
  @IsUUID()
  @IsOptional()
  toCurrencyId?: string;

  @ApiPropertyOptional({ description: 'Rate date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  rateDate?: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class GetFXExposureDto {
  @ApiPropertyOptional({ description: 'Loan ID' })
  @IsUUID()
  @IsOptional()
  loanId?: string;

  @ApiPropertyOptional({ description: 'Currency ID' })
  @IsUUID()
  @IsOptional()
  currencyId?: string;

  @ApiPropertyOptional({ description: 'Exposure type', enum: ExposureType })
  @IsString()
  @IsOptional()
  exposureType?: string;

  @ApiPropertyOptional({ description: 'As of date (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  asOfDate?: string;
}

