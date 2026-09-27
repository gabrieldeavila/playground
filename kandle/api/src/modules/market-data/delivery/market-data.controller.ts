import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { MarketDataUseCase } from '../domain/market-data.use-case';
import { CompanyProfileUseCase } from '../domain/company-profile.use-case';
import { Russell2000UniverseUseCase } from '../domain/russell-2000-universe.use-case';

@Controller('market-data')
export class MarketDataController {
  constructor(
    private readonly marketDataUseCase: MarketDataUseCase,
    private readonly russell2000UniverseUseCase: Russell2000UniverseUseCase,
    private readonly companyProfileUseCase: CompanyProfileUseCase,
  ) {}

  @Get('profile/:ticker')
  getCompanyProfile(@Param('ticker') ticker: string) {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!/^[A-Z0-9^][A-Z0-9.^-]{0,14}$/.test(normalizedTicker)) {
      throw new BadRequestException('Ticker inválido.');
    }
    return this.companyProfileUseCase.execute(normalizedTicker);
  }

  @Get('universe/russell-2000')
  getRussell2000Universe() {
    return this.russell2000UniverseUseCase.execute();
  }

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
