import type { Timeframe } from './signal-snapshot.js';

/** Column arrays, one entry per candle; EMAs are null during their warm-up. */
export interface ChartCandles {
  time: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  ema_9: (number | null)[];
  ema_20: (number | null)[];
  ema_50: (number | null)[];
}

export interface ChartTrade {
  signal_date: string;
  entry_date: string;
  entry_price: number;
  /** Null while the trade is open; exit_price then marks it to the last close. */
  exit_date: string | null;
  exit_price: number;
  days: number;
  return_pct: number;
  exit_reason: 'stop' | 'cruzamento' | null;
  stop_price: number;
  score: number;
  trend_start: boolean;
  liquid: boolean;
  /** Signal on or after test_start: a trade the model never saw while training. */
  test: boolean;
}

export interface TickerChart {
  ticker: string;
  timeframe: Timeframe;
  session: string;
  test_start: string;
  candles: ChartCandles;
  trades: ChartTrade[];
}

export interface TickerChartReader {
  /** Null when the ticker has no candles. */
  read(ticker: string, timeframe: Timeframe): Promise<TickerChart | null>;
}
