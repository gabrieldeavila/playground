import {
  MarketData,
  MarketDataRepository,
  MarketInterval,
  MarketRange,
} from './market-data.repository';

export class MarketDataUseCase {
  constructor(private readonly repository: MarketDataRepository) {}

  searchTickers(query: string): Promise<string[]> {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 1 || normalizedQuery.length > 50) {
      throw new Error('Busca inválida.');
    }

    return this.repository.searchTickers(normalizedQuery);
  }

  execute(
    symbol: string,
    range: MarketRange,
    interval: MarketInterval,
  ): Promise<MarketData> {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!/^[A-Z0-9^._=-]{1,20}$/.test(normalizedSymbol)) {
      throw new Error('Ticker inválido.');
    }

    return this.repository.getCandles(normalizedSymbol, range, interval);
  }
}
