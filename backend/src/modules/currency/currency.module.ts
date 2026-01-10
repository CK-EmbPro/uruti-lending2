import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { FXTransaction } from './entities/fx-transaction.entity';
import { FXExposure } from './entities/fx-exposure.entity';
import { FXHedgingPosition } from './entities/fx-hedging-position.entity';
import { CurrencyService } from './services/currency.service';
import { ExchangeRateApiService } from './services/exchange-rate-api.service';
import { CurrencyConversionService } from './services/currency-conversion.service';
import { ExchangeRateSchedulerService } from './services/exchange-rate-scheduler.service';
import { FXHedgingService } from './services/fx-hedging.service';
import { MultiCurrencyReportingService } from './services/multi-currency-reporting.service';
import { CurrencyController } from './currency.controller';
import { Loan } from '../loan/entities/loan.entity';
import { LoanDisbursement } from '../loan-disbursement/entities/loan-disbursement.entity';
import { LoanRepayment } from '../loan-repayment/entities/loan-repayment.entity';

@Module({
  imports: [
    ScheduleModule,
    TypeOrmModule.forFeature([
      Currency,
      ExchangeRate,
      FXTransaction,
      FXExposure,
      FXHedgingPosition,
      Loan,
      LoanDisbursement,
      LoanRepayment,
    ]),
  ],
  controllers: [CurrencyController],
  providers: [
    CurrencyService,
    ExchangeRateApiService,
    CurrencyConversionService,
    ExchangeRateSchedulerService,
    FXHedgingService,
    MultiCurrencyReportingService,
  ],
  exports: [
    CurrencyService,
    ExchangeRateApiService,
    CurrencyConversionService,
    FXHedgingService,
    MultiCurrencyReportingService,
  ],
})
export class CurrencyModule {}

