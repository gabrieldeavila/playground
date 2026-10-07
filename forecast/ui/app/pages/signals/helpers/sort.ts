import type { SignalSummary } from "../signalsApi";

export const SORT_KEYS = [
  "ticker",
  "signal",
  "score",
  "days",
  "result",
  "stop",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];
export type Sort = { key: SortKey; direction: "asc" | "desc" };

const SORT_VALUES: Record<
  SortKey,
  (signal: SignalSummary) => string | number | null | undefined
> = {
  ticker: (signal) => signal.ticker,
  signal: (signal) => signal.latest.signal_date,
  score: (signal) => signal.latest.score,
  days: (signal) => signal.position?.days,
  result: (signal) => signal.position?.return_pct,
  stop: (signal) => signal.position?.stop_price,
};

/** Sorts by the chosen column; rows without a value always go last. */
export const sortSignals = (signals: SignalSummary[], sort: Sort | null) => {
  if (!sort) return signals;
  const value = SORT_VALUES[sort.key];
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...signals].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (left == null || right == null)
      return left == null ? (right == null ? 0 : 1) : -1;
    return (
      sign *
      (typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right)))
    );
  });
};
