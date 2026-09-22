export type MarketRange =
  '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'max';

export type MarketInterval =
  | '1m'
  | '2m'
  | '5m'
  | '15m'
  | '30m'
  | '60m'
  | '90m'
  | '1h'
  | '1d'
  | '5d'
  | '1wk'
  | '1mo'
  | '3mo';

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  symbol: string;
  exchange: string | null;
  currency: string | null;
  timezone: string | null;
  range: MarketRange;
  interval: MarketInterval;
  candles: MarketCandle[];
}

export interface MarketDataRepository {
  getCandles(
    symbol: string,
    range: MarketRange,
    interval: MarketInterval,
  ): Promise<MarketData>;

  searchTickers(query: string): Promise<string[]>;
}
