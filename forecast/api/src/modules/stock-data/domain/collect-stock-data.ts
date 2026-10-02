import {
  CollectionResult,
  MarketDataProvider,
  StockPrice,
  StockPriceRepository,
} from './stock-price.js';

export class CollectStockData {
  constructor(
    private readonly marketDataProvider: MarketDataProvider,
    private readonly stockPriceRepository: StockPriceRepository,
  ) {}

  async execute(input: {
    tickers: string[];
    startDate: string;
    endDate: string;
  }): Promise<CollectionResult> {
    const prices: StockPrice[] = [];
    const errors: CollectionResult['errors'] = [];

    for (const ticker of input.tickers) {
      try {
        prices.push(
          ...(await this.marketDataProvider.fetchDailyPrices(
            ticker,
            input.startDate,
            input.endDate,
          )),
        );
      } catch (error) {
        errors.push({
          ticker,
          message: error instanceof Error ? error.message : 'Falha na coleta',
        });
      }
    }

    if (prices.length > 0) {
      await this.stockPriceRepository.upsert(prices);
    }

    return {
      savedRows: prices.length,
      tickers: [...new Set(prices.map(({ ticker }) => ticker))],
      errors,
    };
  }
}
