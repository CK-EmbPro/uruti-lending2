import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrencyService } from './services/currency.service';
import { ExchangeRateApiService } from './services/exchange-rate-api.service';
import { ExchangeRateSchedulerService } from './services/exchange-rate-scheduler.service';
import { FXHedgingService } from './services/fx-hedging.service';
import { MultiCurrencyReportingService } from './services/multi-currency-reporting.service';
import {
  CreateCurrencyDto,
  CreateExchangeRateDto,
  ConvertCurrencyDto,
  CreateFXTransactionDto,
  GetExchangeRatesDto,
  GetFXExposureDto,
} from './dto/currency.dto';

@ApiTags('currency')
@ApiBearerAuth('JWT-auth')
@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly currencyService: CurrencyService,
    private readonly exchangeRateApiService: ExchangeRateApiService,
    private readonly exchangeRateSchedulerService: ExchangeRateSchedulerService,
    private readonly fxHedgingService: FXHedgingService,
    private readonly multiCurrencyReportingService: MultiCurrencyReportingService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new currency' })
  @ApiResponse({ status: 201, description: 'Currency created successfully' })
  createCurrency(@Body() dto: CreateCurrencyDto) {
    return this.currencyService.createCurrency(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all currencies' })
  @ApiResponse({ status: 200, description: 'Currencies retrieved successfully' })
  getAllCurrencies() {
    return this.currencyService.getAllCurrencies();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active currencies' })
  @ApiResponse({ status: 200, description: 'Active currencies retrieved' })
  getActiveCurrencies() {
    return this.currencyService.getActiveCurrencies();
  }

  @Get('base')
  @ApiOperation({ summary: 'Get base currency' })
  @ApiResponse({ status: 200, description: 'Base currency retrieved' })
  getBaseCurrency() {
    return this.currencyService.getBaseCurrency();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get currency by code' })
  @ApiResponse({ status: 200, description: 'Currency retrieved' })
  getCurrencyByCode(@Param('code') code: string) {
    return this.currencyService.getCurrencyByCode(code);
  }

  @Post('exchange-rates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create exchange rate' })
  @ApiResponse({ status: 201, description: 'Exchange rate created' })
  createExchangeRate(@Body() dto: CreateExchangeRateDto) {
    return this.currencyService.createExchangeRate(dto);
  }

  @Get('exchange-rates')
  @ApiOperation({ summary: 'Get exchange rates' })
  @ApiResponse({ status: 200, description: 'Exchange rates retrieved' })
  getExchangeRates(@Query() filters: GetExchangeRatesDto) {
    return this.currencyService.getExchangeRates(filters);
  }

  @Get('exchange-rates/:fromCurrencyId/:toCurrencyId')
  @ApiOperation({ summary: 'Get exchange rate between two currencies' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved' })
  getExchangeRate(
    @Param('fromCurrencyId') fromCurrencyId: string,
    @Param('toCurrencyId') toCurrencyId: string,
    @Query('date') date?: string,
  ) {
    return this.currencyService.getExchangeRate(
      fromCurrencyId,
      toCurrencyId,
      date ? new Date(date) : undefined,
    );
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert currency' })
  @ApiResponse({ status: 200, description: 'Currency converted' })
  convertCurrency(@Body() dto: ConvertCurrencyDto) {
    return this.currencyService.convertCurrency(dto);
  }

  @Post('fx-transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create FX transaction' })
  @ApiResponse({ status: 201, description: 'FX transaction created' })
  createFXTransaction(@Body() dto: CreateFXTransactionDto) {
    return this.currencyService.createFXTransaction(dto);
  }

  @Get('fx-exposures')
  @ApiOperation({ summary: 'Get FX exposures' })
  @ApiResponse({ status: 200, description: 'FX exposures retrieved' })
  getFXExposures(@Query() filters: GetFXExposureDto) {
    return this.currencyService.getFXExposures(filters);
  }

  // Exchange Rate API Endpoints
  @Get('exchange-rates/api/:from/:to')
  @ApiOperation({ summary: 'Get exchange rate from API' })
  @ApiResponse({ status: 200, description: 'Exchange rate retrieved from API' })
  async getExchangeRateFromApi(
    @Param('from') from: string,
    @Param('to') to: string,
  ) {
    const rate = await this.exchangeRateApiService.getExchangeRate(from, to);
    return { from, to, rate, timestamp: new Date() };
  }

  @Post('exchange-rates/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger exchange rate update' })
  @ApiResponse({ status: 200, description: 'Exchange rates updated' })
  async updateExchangeRates() {
    return await this.exchangeRateSchedulerService.manualUpdate();
  }

  // Multi-Currency Reporting Endpoints
  @Get('reporting/portfolio')
  @ApiOperation({ summary: 'Get portfolio summary by currency' })
  @ApiResponse({ status: 200, description: 'Portfolio by currency retrieved' })
  getPortfolioByCurrency(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
  ) {
    const statusArray = status ? status.split(',') : undefined;
    return this.multiCurrencyReportingService.getPortfolioByCurrency(
      companyId,
      statusArray,
    );
  }

  @Get('reporting/fx-exposure')
  @ApiOperation({ summary: 'Get FX exposure report' })
  @ApiResponse({ status: 200, description: 'FX exposure report retrieved' })
  getFXExposureReport(@Query('companyId') companyId?: string) {
    return this.multiCurrencyReportingService.getFXExposureReport(companyId);
  }

  @Get('reporting/exchange-rate-history/:fromCurrencyId/:toCurrencyId')
  @ApiOperation({ summary: 'Get exchange rate history' })
  @ApiResponse({ status: 200, description: 'Exchange rate history retrieved' })
  getExchangeRateHistory(
    @Param('fromCurrencyId') fromCurrencyId: string,
    @Param('toCurrencyId') toCurrencyId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.multiCurrencyReportingService.getExchangeRateHistory(
      fromCurrencyId,
      toCurrencyId,
      daysNum,
    );
  }

  @Get('reporting/conversion-summary')
  @ApiOperation({ summary: 'Get currency conversion summary' })
  @ApiResponse({ status: 200, description: 'Conversion summary retrieved' })
  getConversionSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.multiCurrencyReportingService.getConversionSummary(
      new Date(startDate),
      new Date(endDate),
    );
  }

  // FX Hedging Endpoints
  @Post('hedging/positions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create hedging position' })
  @ApiResponse({ status: 201, description: 'Hedging position created' })
  createHedgingPosition(
    @Body()
    dto: {
      loanId: string;
      strategy: string;
      hedgeAmount: number;
      hedgeCurrency: string;
      maturityDate: string;
      targetRate?: number;
    },
  ) {
    return this.fxHedgingService.createHedgingPosition(
      dto.loanId,
      dto.strategy as any,
      dto.hedgeAmount,
      dto.hedgeCurrency,
      new Date(dto.maturityDate),
      dto.targetRate,
    );
  }

  @Get('hedging/exposure/:loanId')
  @ApiOperation({ summary: 'Get FX exposure for a loan' })
  @ApiResponse({ status: 200, description: 'FX exposure retrieved' })
  getFXExposure(@Param('loanId') loanId: string) {
    return this.fxHedgingService.calculateFXExposure(loanId);
  }

  @Get('hedging/recommendations/:loanId')
  @ApiOperation({ summary: 'Get hedging recommendations for a loan' })
  @ApiResponse({ status: 200, description: 'Hedging recommendations retrieved' })
  getHedgingRecommendations(@Param('loanId') loanId: string) {
    return this.fxHedgingService.getHedgingRecommendations(loanId);
  }

  @Get('hedging/positions')
  @ApiOperation({ summary: 'Get all active hedging positions' })
  @ApiResponse({ status: 200, description: 'Active hedging positions retrieved' })
  getActiveHedgingPositions() {
    return this.fxHedgingService.getActivePositions();
  }

  @Post('hedging/positions/:id/mark-to-market')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark hedging position to market' })
  @ApiResponse({ status: 200, description: 'Position marked to market' })
  markToMarket(@Param('id') positionId: string) {
    return this.fxHedgingService.markToMarket(positionId);
  }

  @Post('hedging/positions/:id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute hedging position' })
  @ApiResponse({ status: 200, description: 'Position executed' })
  executeHedgingPosition(@Param('id') positionId: string) {
    return this.fxHedgingService.executeHedgingPosition(positionId);
  }
}

