export type Timeframe = "daily" | "weekly";

export type SignalTrade = {
  signal_date: string;
  exit_date: string | null;
  days: number;
  return_pct: number;
  exit_reason: "stop" | "cruzamento" | null;
  score: number;
  win_rate_pct: number | null;
  trend_start: boolean;
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

export type ModelSummary = {
  rules: string;
  train_signals: string;
  test_signals: string;
  test_by_type: SignalTypeRow[];
  test_by_score_band: ScoreBandRow[];
};

export type TickerOption = {
  ticker: string;
  name: string | null;
};

export type SignalSummary = {
  ticker: string;
  name: string | null;
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
  session: string;
  signal_today: boolean;
  position: OpenPosition | null;
  history: SignalTrade[];
};

export type RefreshStatus = {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
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
