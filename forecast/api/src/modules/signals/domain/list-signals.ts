import {
  SignalSnapshot,
  SignalSnapshotRepository,
  SignalTrade,
  TickerSignals,
  Timeframe,
} from './signal-snapshot.js';

export interface SignalSummary {
  ticker: string;
  name: string | null;
  signal_today: boolean;
  position: TickerSignals['position'];
  latest: SignalTrade;
}

export class ListSignals {
  constructor(private readonly repository: SignalSnapshotRepository) {}

  /** Tickers with a COMPRA today or an open trade: today first, then trend starts, then score. */
  async execute(timeframe: Timeframe = 'daily') {
    const snapshot = await this.repository.read(timeframe);
    if (!snapshot) return null;

    const signals: SignalSummary[] = Object.entries(snapshot.tickers)
      .filter(
        ([, ticker]) =>
          (ticker.signal_today || ticker.position) && ticker.history.length,
      )
      .map(([ticker, { name, signal_today, position, history }]) => ({
        ticker,
        name,
        signal_today,
        position,
        latest: history[0],
      }))
      .sort(
        (left, right) =>
          Number(right.signal_today) - Number(left.signal_today) ||
          Number(right.latest.trend_start) - Number(left.latest.trend_start) ||
          right.latest.score - left.latest.score ||
          left.ticker.localeCompare(right.ticker),
      );

    return { ...metadata(snapshot, timeframe), signals };
  }

  /** Every ticker in the snapshot with its company name, for search suggestions. */
  async listTickers(timeframe: Timeframe = 'daily') {
    const snapshot = await this.repository.read(timeframe);
    if (!snapshot) return null;
    return Object.entries(snapshot.tickers)
      .map(([ticker, { name }]) => ({ ticker, name }))
      .sort((left, right) => left.ticker.localeCompare(right.ticker));
  }

  async findTicker(ticker: string, timeframe: Timeframe = 'daily') {
    const snapshot = await this.repository.read(timeframe);
    const symbol = ticker.toUpperCase();
    const signals = snapshot?.tickers[symbol];
    if (!snapshot || !signals) return null;
    return { ...metadata(snapshot, timeframe), ticker: symbol, ...signals };
  }
}

function metadata(
  { generated_at, session, model }: SignalSnapshot,
  timeframe: Timeframe,
) {
  return { generated_at, session, timeframe, model };
}
