export interface SignalTrade {
  signal_date: string;
  exit_date: string | null;
  days: number;
  return_pct: number;
  exit_reason: 'stop' | 'cruzamento' | null;
  score: number;
}

export interface OpenPosition {
  signal_date: string;
  days: number;
  return_pct: number;
  score: number;
  stop_price: number;
}

export interface TickerSignals {
  name: string | null;
  signal_today: boolean;
  position: OpenPosition | null;
  history: SignalTrade[];
}

export interface ScoreSummaryRow {
  min_score: number;
  trades: number;
  win_rate_pct: number;
  mean_return_pct: number;
  median_days: number;
  short_trades_pct: number;
}

export interface SignalSnapshot {
  generated_at: string;
  session: string;
  model: {
    rules: string;
    train_signals: string;
    test_signals: string;
    test_by_min_score: ScoreSummaryRow[];
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
