import axios from "axios";

import type { MarketDataResponse } from "@/types/interface/market-data-candle.interface";
import {
  getClosedCandles,
  getLastBuySignal,
  getWatchlistHistoryRange,
  MINIMUM_SIGNAL_CANDLES,
  normalizeMarketCandles,
  type WatchlistInterval,
} from "./watchlist";

export type WatchlistSignalResult = {
  signalTime: string | number | null;
  hasEnoughHistory: boolean;
  checkedAt: number;
};

const CACHE_KEY = "kandle:watchlist-signals:v2";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

const readCache = (): Record<string, WatchlistSignalResult> => {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(CACHE_KEY) ?? "null",
    );
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, WatchlistSignalResult] => {
          const value = entry[1] as Partial<WatchlistSignalResult>;
          return (
            typeof value?.checkedAt === "number" &&
            now - value.checkedAt < CACHE_TTL_MS &&
            typeof value.hasEnoughHistory === "boolean" &&
            (value.signalTime === null ||
              typeof value.signalTime === "string" ||
              typeof value.signalTime === "number")
          );
        },
      ),
    );
  } catch {
    return {};
  }
};

const cacheKeyFor = (ticker: string, interval: WatchlistInterval) =>
  `${interval}:${ticker}`;

const writeCache = (
  ticker: string,
  interval: WatchlistInterval,
  result: WatchlistSignalResult,
) => {
  if (typeof window === "undefined") return;
  try {
    const cache = readCache();
    cache[cacheKeyFor(ticker, interval)] = result;
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // The result remains available in memory when session storage is unavailable.
  }
};

export const getCachedWatchlistSignal = (
  ticker: string,
  interval: WatchlistInterval,
) => readCache()[cacheKeyFor(ticker, interval)] ?? null;

export async function fetchWatchlistSignal(
  ticker: string,
  interval: WatchlistInterval,
  signal: AbortSignal,
): Promise<WatchlistSignalResult> {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) throw new Error("A URL da API não está configurada.");

  const { from, to } = getWatchlistHistoryRange();
  const { data } = await axios.get<MarketDataResponse>(
    `${apiUrl}/market-data/${encodeURIComponent(ticker)}`,
    {
      params: { from, to, interval },
      signal,
    },
  );
  const candles = normalizeMarketCandles(data);
  const closedCandles = getClosedCandles(candles, interval);
  const hasEnoughHistory = closedCandles.length >= MINIMUM_SIGNAL_CANDLES;
  const lastSignal = hasEnoughHistory
    ? getLastBuySignal(candles, interval)
    : null;
  const result: WatchlistSignalResult = {
    signalTime: lastSignal?.time ?? null,
    hasEnoughHistory,
    checkedAt: Date.now(),
  };
  writeCache(ticker, interval, result);
  return result;
}
