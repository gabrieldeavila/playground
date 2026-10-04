import {
  SignalSnapshot,
  SignalSnapshotRepository,
  SignalTrade,
  TickerSignals,
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
  async execute() {
    const snapshot = await this.repository.read();
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

    return { ...metadata(snapshot), signals };
  }

  /** Every ticker in the snapshot with its company name, for search suggestions. */
  async listTickers() {
    const snapshot = await this.repository.read();
    if (!snapshot) return null;
    return Object.entries(snapshot.tickers)
      .map(([ticker, { name }]) => ({ ticker, name }))
      .sort((left, right) => left.ticker.localeCompare(right.ticker));
  }

  async findTicker(ticker: string) {
    const snapshot = await this.repository.read();
    const symbol = ticker.toUpperCase();
    const signals = snapshot?.tickers[symbol];
    if (!snapshot || !signals) return null;
    return { ...metadata(snapshot), ticker: symbol, ...signals };
  }
}

function metadata({ generated_at, session, model }: SignalSnapshot) {
  return { generated_at, session, model };
}
