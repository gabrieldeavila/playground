import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { MarketDataUseCase } from '../domain/market-data.use-case';

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
    @Query('range') range?: string,
    @Query('interval') interval?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketDataUseCase.execute(ticker, {
      range,
      interval,
      from,
      to,
    });
  }
}
