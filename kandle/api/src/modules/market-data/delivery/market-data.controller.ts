import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { MarketDataUseCase } from '../domain/market-data.use-case';
import { MarketInterval, MarketRange } from '../domain/market-data.repository';

const ranges: MarketRange[] = [
  '1d',
  '5d',
  '1mo',
  '3mo',
  '6mo',
  '1y',
  '2y',
  '5y',
  '10y',
  'max',
];

const intervals: MarketInterval[] = [
  '1m',
  '2m',
  '5m',
  '15m',
  '30m',
  '60m',
  '90m',
  '1h',
  '1d',
  '5d',
  '1wk',
  '1mo',
  '3mo',
];

@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataUseCase: MarketDataUseCase) {}

  @Get('search')
  searchTickers(@Query('q') query?: string) {
    const normalizedQuery = query?.trim();

    if (!normalizedQuery) {
      throw new BadRequestException('Informe o parâmetro q.');
    }

    if (normalizedQuery.length > 50) {
      throw new BadRequestException(
        'O parâmetro q deve ter no máximo 50 caracteres.',
      );
    }

    return this.marketDataUseCase.searchTickers(normalizedQuery);
  }

  @Get(':ticker')
  getCandles(
    @Param('ticker') ticker: string,
    @Query('range') range = '1d',
    @Query('interval') interval = '5m',
  ) {
    if (!/^[a-zA-Z0-9^._=-]{1,20}$/.test(ticker.trim())) {
      throw new BadRequestException('Ticker inválido.');
    }

    if (!ranges.includes(range as MarketRange)) {
      throw new BadRequestException('range inválido.');
    }

    if (!intervals.includes(interval as MarketInterval)) {
      throw new BadRequestException('interval inválido.');
    }

    return this.marketDataUseCase.execute(
      ticker,
      range as MarketRange,
      interval as MarketInterval,
    );
  }
}
