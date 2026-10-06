export type Timeframe = "daily" | "weekly";

export type MarketIndex =
  | "sp500"
  | "sp400"
  | "sp600"
  | "r2000"
  | "nyse"
  | "nasdaq"
  | "watchlist"
  | "other";

export type SignalTrade = {
  signal_date: string;
  exit_date: string | null;
  /** Null while pending. */
  days: number | null;
  /** Null while pending. */
  return_pct: number | null;
  exit_reason: "stop" | "cruzamento" | null;
  score: number;
  win_rate_pct: number | null;
  trend_start: boolean;
  /** COMPRA on the last closed candle: buy at the next open. */
  pending?: boolean;
};

export type OpenPosition = {
  signal_date: string;
  days: number;
  return_pct: number;
  score: number;
  win_rate_pct: number | null;
  trend_start: boolean;
  stop_price: number;
};

export type SignalTypeRow = {
  type: "trend_start" | "all";
  trades: number;
  win_rate_pct: number;
  mean_return_pct: number;
  median_days: number;
};

export type ScoreBandRow = {
  score_from: number;
  score_to: number;
  trades: number;
  win_rate_pct: number;
  mean_return_pct: number;
  median_days: number;
};

export type IndexRow = {
  index: MarketIndex;
  trades: number;
  win_rate_pct: number | null;
  score_70_plus_win_rate_pct: number | null;
  mean_return_pct: number;
};

export type ModelSummary = {
  rules: string;
  train_signals: string;
  test_signals: string;
  test_by_type: SignalTypeRow[];
  test_by_score_band: ScoreBandRow[];
  test_by_index?: IndexRow[];
};

export type TickerOption = {
  ticker: string;
  name: string | null;
  index: MarketIndex | null;
};

export type SignalSummary = {
  ticker: string;
  name: string | null;
  index: MarketIndex | null;
  sector: string | null;
  signal_today: boolean;
  position: OpenPosition | null;
  latest: SignalTrade;
};

export type SignalsResponse = {
  generated_at: string;
  session: string;
  timeframe: Timeframe;
  model: ModelSummary;
  signals: SignalSummary[];
};

export type TickerDetail = {
  ticker: string;
  name: string | null;
  index?: MarketIndex;
  sector?: string | null;
  liquid?: boolean;
  session: string;
  signal_today: boolean;
  position: OpenPosition | null;
  history: SignalTrade[];
};

export type RefreshProgress = {
  phase: "download" | "predict";
  /** Timeframe being scored; null while downloading. */
  timeframe: Timeframe | null;
  done: number;
  total: number;
  /** Whole job, 0–100. */
  percent: number;
};

export type RefreshStatus = {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  progress: RefreshProgress | null;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5001";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(body?.message ?? `HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

export const fetchSignals = (timeframe: Timeframe) =>
  request<SignalsResponse>(`/signals?timeframe=${timeframe}`);

export const fetchTickers = (timeframe: Timeframe) =>
  request<TickerOption[]>(`/signals/tickers?timeframe=${timeframe}`);

export const fetchTicker = (ticker: string, timeframe: Timeframe) =>
  request<TickerDetail>(
    `/signals/${encodeURIComponent(ticker)}?timeframe=${timeframe}`,
  );

export const fetchRefreshStatus = () =>
  request<RefreshStatus>("/signals/refresh");

export const startRefresh = (download: boolean) =>
  request<RefreshStatus>("/signals/refresh", {
    method: "POST",
    body: JSON.stringify({ download }),
  });

/** Column arrays, one entry per candle; EMAs are null during their warm-up. */
export type ChartCandles = {
  time: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  ema_9: (number | null)[];
  ema_20: (number | null)[];
  ema_50: (number | null)[];
};

export type ChartTrade = {
  signal_date: string;
  entry_date: string;
  entry_price: number;
  /** Null while open; exit_price then marks the trade to the last close. */
  exit_date: string | null;
  exit_price: number;
  days: number;
  return_pct: number;
  exit_reason: "stop" | "cruzamento" | null;
  stop_price: number;
  score: number;
  trend_start: boolean;
  liquid: boolean;
  /** Signal on or after test_start: the model never saw it while training. */
  test: boolean;
};

/** COMPRA on the last closed candle; its trade starts at the next open. */
export type ChartPending = {
  signal_date: string;
  score: number;
  trend_start: boolean;
  /** Estimated from the signal close; the real stop uses the entry open. */
  stop_price: number;
};

export type TickerChart = {
  ticker: string;
  timeframe: Timeframe;
  session: string;
  test_start: string;
  candles: ChartCandles;
  trades: ChartTrade[];
  pending?: ChartPending | null;
};

export const fetchChart = (ticker: string, timeframe: Timeframe) =>
  request<TickerChart>(
    `/signals/${encodeURIComponent(ticker)}/chart?timeframe=${timeframe}`,
  );
