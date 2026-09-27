import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type {
  MarketDataCandle,
  MarketDataRecord,
  MarketDataResponse,
} from "@/types/interface/market-data-candle.interface";
import { getHistoricalBuySignals } from "@/app/components/StockChart/features/trend/marketTrend";

export const WATCHLIST_STORAGE_KEY = "kandle:watchlist:v1";
export const MINIMUM_SIGNAL_CANDLES = 205;
const WATCHLIST_HISTORY_YEARS = 6;
const BUY_EMA_PERIODS = [9, 20, 50, 100, 200] as const;

const getRecords = (response: MarketDataResponse): MarketDataRecord[] => {
  if (Array.isArray(response)) return response;
  return (
    response.candles ??
    response.data ??
    response.results ??
    response.prices ??
    []
  );
};

const toDate = (value: string | number) => {
  if (typeof value === "number") {
    return new Date(value > 10_000_000_000 ? value : value * 1000);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
};

export const normalizeMarketCandles = (
  response: MarketDataResponse,
): MarketDataCandle[] =>
  getRecords(response)
    .map((record) => {
      const time =
        record.time ?? record.timestamp ?? record.datetime ?? record.date;
      const open = Number(record.open);
      const high = Number(record.high);
      const low = Number(record.low);
      const close = Number(record.close);
      if (
        time === undefined ||
        Number.isNaN(toDate(time).getTime()) ||
        ![open, high, low, close].every(Number.isFinite)
      )
        return null;
      const volume =
        record.volume === undefined ? undefined : Number(record.volume);
      return {
        time,
        open,
        high,
        low,
        close,
        ...(volume !== undefined && Number.isFinite(volume) ? { volume } : {}),
      };
    })
    .filter((candle): candle is MarketDataCandle => candle !== null)
    .sort(
      (left, right) =>
        toDate(left.time).getTime() - toDate(right.time).getTime(),
    );

export type WatchlistInterval =
  | typeof MarketDataInterval.Daily
  | typeof MarketDataInterval.Weekly;

/** Exclui o candle diário ou semanal ainda em formação. */
export const getClosedCandles = (
  candles: MarketDataCandle[],
  interval: WatchlistInterval,
  now = new Date(),
) => {
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setUTCHours(0, 0, 0, 0);
  if (interval === MarketDataInterval.Weekly) {
    currentPeriodStart.setUTCDate(
      currentPeriodStart.getUTCDate() - ((currentPeriodStart.getUTCDay() + 6) % 7),
    );
  }
  return candles.filter(
    (candle) => toDate(candle.time).getTime() < currentPeriodStart.getTime(),
  );
};

export const getLastBuySignal = (
  candles: MarketDataCandle[],
  interval: WatchlistInterval,
) => {
  const closedCandles = getClosedCandles(candles, interval);
  const signals = getHistoricalBuySignals(closedCandles, BUY_EMA_PERIODS);
  return signals.at(-1) ?? null;
};

export const getDaysSince = (signalTime: string | number, now = new Date()) => {
  const signalDate = toDate(signalTime);
  const todayUtc = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const signalUtc = Date.UTC(
    signalDate.getUTCFullYear(),
    signalDate.getUTCMonth(),
    signalDate.getUTCDate(),
  );
  return Math.max(0, Math.floor((todayUtc - signalUtc) / 86_400_000));
};

export const getSignalDate = (signalTime: string | number) =>
  toDate(signalTime);

export const getWatchlistHistoryRange = (now = new Date()) => {
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - WATCHLIST_HISTORY_YEARS);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
};
