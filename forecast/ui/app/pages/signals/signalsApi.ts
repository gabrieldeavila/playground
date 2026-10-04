export type SignalTrade = {
  signal_date: string;
  exit_date: string | null;
  days: number;
  return_pct: number;
  exit_reason: "stop" | "cruzamento" | null;
  score: number;
};

export type OpenPosition = {
  signal_date: string;
  days: number;
  return_pct: number;
  score: number;
  stop_price: number;
};

export type ScoreSummaryRow = {
  min_score: number;
  trades: number;
  win_rate_pct: number;
  mean_return_pct: number;
  median_days: number;
  short_trades_pct: number;
};

export type ModelSummary = {
  rules: string;
  train_signals: string;
  test_signals: string;
  test_by_min_score: ScoreSummaryRow[];
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

export const fetchSignals = () => request<SignalsResponse>("/signals");

export const fetchTickers = () => request<TickerOption[]>("/signals/tickers");

export const fetchTicker = (ticker: string) =>
  request<TickerDetail>(`/signals/${encodeURIComponent(ticker)}`);

export const fetchRefreshStatus = () =>
  request<RefreshStatus>("/signals/refresh");

export const startRefresh = (download: boolean) =>
  request<RefreshStatus>("/signals/refresh", {
    method: "POST",
    body: JSON.stringify({ download }),
  });
