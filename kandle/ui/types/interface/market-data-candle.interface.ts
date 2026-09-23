export interface MarketDataCandle {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface MarketDataRecord {
  time?: string | number;
  timestamp?: string | number;
  date?: string | number;
  datetime?: string | number;
  open: number | string;
  high: number | string;
  low: number | string;
  close: number | string;
  volume?: number | string;
}

export type MarketDataResponse =
  | MarketDataRecord[]
  | {
      data?: MarketDataRecord[];
      candles?: MarketDataRecord[];
      results?: MarketDataRecord[];
      prices?: MarketDataRecord[];
    };
