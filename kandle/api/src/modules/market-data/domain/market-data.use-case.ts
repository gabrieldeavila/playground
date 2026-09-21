import {
  MarketData,
  MarketDataRepository,
  MarketInterval,
  MarketRange,
} from './market-data.repository';

export class MarketDataUseCase {
  constructor(private readonly repository: MarketDataRepository) {}

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
