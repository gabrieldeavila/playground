export interface StockPrice {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
}

export interface MarketDataProvider {
  fetchDailyPrices(
    ticker: string,
    startDate: string,
    endDate: string,
  ): Promise<StockPrice[]>;
}

export interface StockPriceRepository {
  upsert(prices: StockPrice[]): Promise<void>;
}

export interface CollectionResult {
  savedRows: number;
  tickers: string[];
  errors: Array<{ ticker: string; message: string }>;
}
