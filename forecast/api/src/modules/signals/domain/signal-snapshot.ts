export interface SignalTrade {
  signal_date: string;
  exit_date: string | null;
  days: number;
  return_pct: number;
  exit_reason: 'stop' | 'cruzamento' | null;
  score: number;
  win_rate_pct: number | null;
  trend_start: boolean;
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

export interface SignalSnapshot {
  generated_at: string;
  session: string;
  model: {
    rules: string;
    train_signals: string;
    test_signals: string;
    test_by_type: SignalTypeRow[];
    test_by_score_band: ScoreBandRow[];
  };
  tickers: Record<string, TickerSignals>;
}

export interface SignalSnapshotRepository {
  read(): Promise<SignalSnapshot | null>;
}

export interface RefreshStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
}

export interface SignalRefreshRunner {
  start(options: { download: boolean }): RefreshStatus;
  status(): RefreshStatus;
}
