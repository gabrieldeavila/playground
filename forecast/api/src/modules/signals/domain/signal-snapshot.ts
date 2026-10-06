export const TIMEFRAMES = ['daily', 'weekly'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const MARKET_INDEXES = [
  'sp500',
  'sp400',
  'sp600',
  'r2000',
  'nyse',
  'nasdaq',
  'watchlist',
  'other',
] as const;
export type MarketIndex = (typeof MARKET_INDEXES)[number];

export interface SignalTrade {
  signal_date: string;
  exit_date: string | null;
  /** Null while pending. */
  days: number | null;
  /** Null while pending. */
  return_pct: number | null;
  exit_reason: 'stop' | 'cruzamento' | null;
  score: number;
  win_rate_pct: number | null;
  trend_start: boolean;
  /** COMPRA on the last closed candle: buy at the next open. Absent in older snapshots. */
  pending?: boolean;
}

export interface OpenPosition {
  signal_date: string;
  days: number;
  return_pct: number;
  score: number;
  win_rate_pct: number | null;
  trend_start: boolean;
  stop_price: number;
}

export interface TickerSignals {
  name: string | null;
  /** Absent in snapshots written before the universe had indexes. */
  index?: MarketIndex;
  sector?: string | null;
  /** False when recent traded value is below the model's liquidity floor. */
  liquid?: boolean;
  /** The latest history entry is a pending COMPRA. */
  signal_today: boolean;
  position: OpenPosition | null;
  history: SignalTrade[];
}

export interface SignalTypeRow {
  type: 'trend_start' | 'all';
  trades: number;
  win_rate_pct: number;
  mean_return_pct: number;
  median_days: number;
}

export interface ScoreBandRow {
  score_from: number;
  score_to: number;
  trades: number;
  win_rate_pct: number;
  mean_return_pct: number;
  median_days: number;
}

export interface IndexRow {
  index: MarketIndex;
  trades: number;
  auc: number | null;
  win_rate_pct: number | null;
  score_70_plus_win_rate_pct: number | null;
  score_below_30_win_rate_pct: number | null;
  mean_return_pct: number;
}

export interface SignalSnapshot {
  generated_at: string;
  session: string;
  timeframe?: Timeframe;
  model: {
    rules: string;
    train_signals: string;
    test_signals: string;
    test_by_type: SignalTypeRow[];
    test_by_score_band: ScoreBandRow[];
    test_by_index?: IndexRow[];
  };
  tickers: Record<string, TickerSignals>;
}

export interface SignalSnapshotRepository {
  read(timeframe: Timeframe): Promise<SignalSnapshot | null>;
}

export type RefreshPhase = 'download' | 'predict';

export interface RefreshProgress {
  phase: RefreshPhase;
  /** Timeframe being scored; null while downloading. */
  timeframe: Timeframe | null;
  /** Tickers downloaded or timeframes scored so far, out of `total`. */
  done: number;
  total: number;
  /** Whole job, 0–100; never goes back when the phase changes. */
  percent: number;
}

export interface RefreshStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  progress: RefreshProgress | null;
}

export interface SignalRefreshRunner {
  start(options: { download: boolean }): RefreshStatus;
  status(): RefreshStatus;
}
