import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { MarketDataResponse } from "@/types/interface/market-data-candle.interface";
import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";
import { normalizeMarketCandles } from "../watchlist/watchlist";
import {
  backtestOpportunities,
  classifyOpportunity,
  getOpportunityHistoryRange,
  MINIMUM_OPPORTUNITY_CANDLES,
  type Opportunity,
  type OpportunityBacktest,
  type OpportunityCriteria,
} from "./opportunities";

export type OpportunityState =
  | { status: "loading" }
  | { status: "success"; result: Opportunity | null }
  | { status: "error" };

const CACHE_KEY = "kandle:opportunities:v6";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 3;

type CachedOpportunity = { checkedAt: number; result: Opportunity | null };

const readCache = (): Record<string, CachedOpportunity> => {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(CACHE_KEY) ?? "null",
    );
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
      return {};
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(parsed).filter(([, entry]) => {
        const value = entry as Partial<CachedOpportunity>;
        return (
          typeof value.checkedAt === "number" &&
          now - value.checkedAt < CACHE_TTL_MS
        );
      }),
    ) as Record<string, CachedOpportunity>;
  } catch {
    return {};
  }
};

export const getOpportunityStateKey = (
  ticker: string,
  interval: string,
  selectedEmaPeriods: readonly number[],
) => `${ticker.toUpperCase()}:${interval}:${[...selectedEmaPeriods].sort((a, b) => a - b).join(",") || "none"}`;

const cacheEntryKey = (
  ticker: string,
  interval: string,
  selectedEmaPeriods: readonly number[],
) => getOpportunityStateKey(ticker, interval, selectedEmaPeriods);

const writeCache = (
  ticker: string,
  interval: string,
  selectedEmaPeriods: readonly number[],
  result: Opportunity | null,
) => {
  if (typeof window === "undefined") return;
  try {
    const cache = readCache();
    cache[cacheEntryKey(ticker, interval, selectedEmaPeriods)] = {
      checkedAt: Date.now(),
      result,
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Mantém o resultado no estado da tela se o armazenamento não estiver disponível.
  }
};

async function fetchOpportunity(
  ticker: string,
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly,
  selectedEmaPeriods: readonly number[],
  signal: AbortSignal,
) {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) throw new Error("A URL da API não está configurada.");
  const { from, to } = getOpportunityHistoryRange();
  const { data } = await axios.get<MarketDataResponse>(
    `${apiUrl}/market-data/${encodeURIComponent(ticker)}`,
    { params: { from, to, interval }, signal },
  );
  return classifyOpportunity(
    normalizeMarketCandles(data),
    interval,
    new Date(),
    undefined,
    selectedEmaPeriods,
  );
}

export function useOpportunities(
  assets: TickerSuggestion[],
  enabled: boolean,
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly,
  selectedEmaPeriods: readonly number[],
) {
  const [states, setStates] = useState<Record<string, OpportunityState>>({});
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    const tickers = assets.map(({ value }) => value.trim().toUpperCase());

    setStates((current) => {
      const next = { ...current };
      tickers.forEach((ticker) => {
        const key = cacheEntryKey(ticker, interval, selectedEmaPeriods);
        const cached = readCache()[key];
        next[key] = cached
          ? { status: "success", result: cached.result }
          : { status: "loading" };
      });
      return next;
    });

    void (async () => {
      for (let index = 0; index < tickers.length; index += BATCH_SIZE) {
        const batch = tickers
          .slice(index, index + BATCH_SIZE)
          .filter(
            (ticker) =>
              !readCache()[cacheEntryKey(ticker, interval, selectedEmaPeriods)],
          );
        await Promise.all(
          batch.map(async (ticker) => {
            try {
              const result = await fetchOpportunity(
                ticker,
                interval,
                selectedEmaPeriods,
                controller.signal,
              );
              writeCache(ticker, interval, selectedEmaPeriods, result);
              if (active)
                setStates((current) => ({
                  ...current,
                  [cacheEntryKey(ticker, interval, selectedEmaPeriods)]: {
                    status: "success",
                    result,
                  },
                }));
            } catch {
              if (active && !controller.signal.aborted) {
                setStates((current) => ({
                  ...current,
                  [cacheEntryKey(ticker, interval, selectedEmaPeriods)]: {
                    status: "error",
                  },
                }));
              }
            }
          }),
        );
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [assets, enabled, interval, retryVersion, selectedEmaPeriods]);

  const retry = (ticker: string) => {
    const normalized = ticker.toUpperCase();
    const key = cacheEntryKey(normalized, interval, selectedEmaPeriods);
    try {
      const cache = readCache();
      delete cache[key];
      window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // A nova tentativa ainda funciona sem cache.
    }
    setStates((current) => ({
      ...current,
      [key]: { status: "loading" },
    }));
    setRetryVersion((version) => version + 1);
  };

  return {
    states,
    retry,
  };
}

export type HistoricalValidationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: OpportunityBacktest }
  | { status: "error"; message: string };

export function useHistoricalOpportunityValidation(
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly,
) {
  const [state, setState] = useState<HistoricalValidationState>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => controllerRef.current?.abort(),
    [],
  );

  const validate = useCallback(
    async (
      ticker: string,
      from: string,
      to: string,
      criteria: OpportunityCriteria,
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({ status: "loading" });
      try {
        const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
        if (!apiUrl) throw new Error("A URL da API não está configurada.");
        const historyStart = new Date(`${from}T00:00:00Z`);
        const warmupCandles = Math.max(
          MINIMUM_OPPORTUNITY_CANDLES,
          criteria.recentHighLookback,
          9 + criteria.emaSlopeLookback,
        );
        const warmupDays = Math.max(
          730,
          warmupCandles *
            (interval === MarketDataInterval.Daily ? 2 : 7),
        );
        historyStart.setUTCDate(historyStart.getUTCDate() - warmupDays);
        const { data } = await axios.get<MarketDataResponse>(
          `${apiUrl}/market-data/${encodeURIComponent(ticker)}`,
          {
            params: {
              from: historyStart.toISOString().slice(0, 10),
              to,
              interval,
            },
            signal: controller.signal,
          },
        );
        const result = backtestOpportunities(
          normalizeMarketCandles(data),
          interval,
          from,
          to,
          criteria,
        );
        if (!controller.signal.aborted) setState({ status: "success", result });
      } catch {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message: "Não foi possível carregar os candles para o período escolhido.",
          });
        }
      }
    },
    [interval],
  );

  return { state, validate };
}
