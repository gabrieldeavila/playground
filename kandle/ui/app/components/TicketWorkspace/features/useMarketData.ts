import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  MarketDataCandle,
  MarketDataRecord,
  MarketDataResponse,
} from "@/types/interface/market-data-candle.interface";
import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { TicketWorkspacePersistence } from "@/types/interface/ticket-workspace-persistence.interface";

export type MarketDataDirection = "older" | "newer";
type MarketDataRequest = {
  ticker: string;
  from: string;
  to: string;
  key: string;
  generation: number;
  interval: MarketDataInterval;
};

const INITIAL_RANGE_YEARS = 6;
const MONTHLY_INITIAL_RANGE_YEARS = 20;
const EXTENSION_YEARS = 1;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const toChartTime = (value: string | number): string | number => {
  if (typeof value === "number") {
    return value > 10_000_000_000 ? Math.floor(value / 1000) : value;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : Math.floor(timestamp / 1000);
};

const toDate = (value: string | number): Date => {
  if (typeof value === "number") {
    return new Date(value > 10_000_000_000 ? value : value * 1000);
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : new Date(value);
};

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const getCandles = (response: MarketDataResponse): MarketDataRecord[] => {
  if (Array.isArray(response)) return response;
  return (
    response.data ??
    response.candles ??
    response.results ??
    response.prices ??
    []
  );
};

const normalizeCandles = (response: MarketDataResponse): MarketDataCandle[] =>
  getCandles(response)
    .map((candle) => {
      const time =
        candle.time ?? candle.timestamp ?? candle.datetime ?? candle.date;
      const open = Number(candle.open);
      const high = Number(candle.high);
      const low = Number(candle.low);
      const close = Number(candle.close);
      if (
        time === undefined ||
        ![open, high, low, close].every(Number.isFinite)
      ) {
        return null;
      }
      const volume =
        candle.volume === undefined ? undefined : Number(candle.volume);
      return {
        time: toChartTime(time),
        open,
        high,
        low,
        close,
        ...(volume !== undefined && Number.isFinite(volume) ? { volume } : {}),
      };
    })
    .filter((candle): candle is MarketDataCandle => candle !== null)
    .sort((a, b) => toDate(a.time).getTime() - toDate(b.time).getTime());

const candleKey = (time: string | number) => {
  const date = toDate(time);
  return Number.isNaN(date.getTime())
    ? String(time)
    : date.toISOString().slice(0, 10);
};

const mergeCandles = (...groups: MarketDataCandle[][]): MarketDataCandle[] => {
  const byDate = new Map<string, MarketDataCandle>();
  groups.flat().forEach((candle) => byDate.set(candleKey(candle.time), candle));
  return [...byDate.values()].sort(
    (a, b) => toDate(a.time).getTime() - toDate(b.time).getTime(),
  );
};

const shiftYears = (date: Date, years: number) => {
  const shifted = new Date(date);
  shifted.setUTCFullYear(shifted.getUTCFullYear() + years);
  return shifted;
};

const makeRequest = (
  ticker: string,
  from: Date,
  to: Date,
  generation: number,
  interval: MarketDataInterval,
): MarketDataRequest => {
  const fromDate = formatDate(from);
  const toDateValue = formatDate(to);
  return {
    ticker,
    from: fromDate,
    to: toDateValue,
    key: `${ticker}:${fromDate}:${toDateValue}:${interval}`,
    generation,
    interval,
  };
};

export function useMarketData(initialState?: TicketWorkspacePersistence) {
  const [marketData, setMarketData] = useState<MarketDataCandle[]>(
    initialState?.marketData ?? [],
  );
  const [ticker, setTicker] = useState(initialState?.selectedTicker ?? "");
  const [interval, setInterval] = useState(
    initialState?.interval ?? MarketDataInterval.Weekly,
  );
  const [dataTicker, setDataTicker] = useState(initialState?.dataTicker ?? "");
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const activeTickerRef = useRef(initialState?.selectedTicker ?? "");
  const activeIntervalRef = useRef(
    initialState?.interval ?? MarketDataInterval.Weekly,
  );
  const generationRef = useRef(0);
  const requestsRef = useRef(new Map<string, AbortController>());
  // Successful ranges (including ranges with no trading data) are remembered
  // so chart range events cannot repeatedly ask the backend for the same span.
  const requestedRangesRef = useRef(new Set<string>());
  // Keep the actual date spans as well as the request key. A logical-range
  // event can produce a slightly different request after a prepend; checking
  // spans prevents asking the backend for an already fetched overlap.
  const completedRangesRef = useRef(
    new Array<{ from: number; to: number; generation: number }>(),
  );
  const failedRequestRef = useRef<MarketDataRequest | null>(null);

  const isRangeCompleted = (request: MarketDataRequest) => {
    const from = Date.parse(request.from);
    const to = Date.parse(request.to);
    return completedRangesRef.current.some(
      (range) =>
        range.generation === request.generation &&
        range.from <= from &&
        range.to >= to,
    );
  };

  const rememberRange = (request: MarketDataRequest) => {
    const from = Date.parse(request.from);
    const to = Date.parse(request.to);
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    completedRangesRef.current.push({
      from,
      to,
      generation: request.generation,
    });
  };

  const requestRange = useCallback(async (request: MarketDataRequest) => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
    if (
      request.ticker !== activeTickerRef.current ||
      request.generation !== generationRef.current
    ) {
      return;
    }
    if (
      requestedRangesRef.current.has(request.key) ||
      requestsRef.current.has(request.key) ||
      isRangeCompleted(request)
    ) {
      return;
    }
    if (!apiUrl) {
      requestedRangesRef.current.add(request.key);
      rememberRange(request);
      failedRequestRef.current = request;
      setError("A URL da API não está configurada.");
      return;
    }

    const controller = new AbortController();
    requestsRef.current.set(request.key, controller);
    setLoadingCount((count) => count + 1);
    setError(null);

    try {
      const { data } = await axios.get<MarketDataResponse>(
        `${apiUrl}/market-data/${encodeURIComponent(request.ticker)}`,
        {
          params: {
            from: request.from,
            to: request.to,
            interval: request.interval,
          },
          signal: controller.signal,
        },
      );
      if (
        activeTickerRef.current !== request.ticker ||
        generationRef.current !== request.generation
      ) {
        return;
      }

      const candles = normalizeCandles(data);
      setMarketData((current) => mergeCandles(current, candles));
      setDataTicker(request.ticker);
      // Remember empty results too: an empty range is still a completed query.
      requestedRangesRef.current.add(request.key);
      rememberRange(request);
      if (failedRequestRef.current?.key === request.key) {
        failedRequestRef.current = null;
        setError(null);
      }
    } catch (requestError) {
      if (
        !axios.isCancel(requestError) &&
        activeTickerRef.current === request.ticker &&
        generationRef.current === request.generation
      ) {
        // 404 is also used when a period has no candles. Mark failed spans as
        // visited so the edge observer cannot create a request loop; the
        // explicit retry action removes this marker again.
        requestedRangesRef.current.add(request.key);
        rememberRange(request);
        failedRequestRef.current = request;
        setError("Não foi possível carregar os candles. Tente novamente.");
      }
    } finally {
      // An aborted request from an older generation must not remove a newer
      // request for the same ticker and date range.
      if (requestsRef.current.get(request.key) === controller) {
        requestsRef.current.delete(request.key);
      }
      if (
        activeTickerRef.current === request.ticker &&
        generationRef.current === request.generation
      ) {
        setLoadingCount((count) => Math.max(0, count - 1));
      }
    }
  }, []);

  const loadTicker = useCallback(
    async (nextTicker: string) => {
      const normalizedTicker = nextTicker.trim();
      if (!normalizedTicker) return;

      if (
        normalizedTicker === activeTickerRef.current &&
        (requestedRangesRef.current.size > 0 || requestsRef.current.size > 0)
      ) {
        return;
      }

      // Increment first so even a fast response from an aborted query is stale.
      const generation = ++generationRef.current;
      requestsRef.current.forEach((controller) => controller.abort());
      requestsRef.current.clear();
      requestedRangesRef.current.clear();
      completedRangesRef.current = [];
      failedRequestRef.current = null;
      activeTickerRef.current = normalizedTicker;
      setTicker(normalizedTicker);
      setDataTicker("");
      setMarketData([]);
      setLoadingCount(0);
      setError(null);

      const to = new Date();
      const historyYears =
        activeIntervalRef.current === MarketDataInterval.Monthly
          ? MONTHLY_INITIAL_RANGE_YEARS
          : INITIAL_RANGE_YEARS;
      const from = shiftYears(to, -historyYears);
      await requestRange(
        makeRequest(normalizedTicker, from, to, generation, activeIntervalRef.current),
      );
    },
    [requestRange],
  );

  const changeInterval = useCallback(
    async (nextInterval: MarketDataInterval) => {
      if (nextInterval === activeIntervalRef.current) return;

      activeIntervalRef.current = nextInterval;
      setInterval(nextInterval);
      requestedRangesRef.current.clear();
      completedRangesRef.current = [];
      failedRequestRef.current = null;
      const generation = ++generationRef.current;
      requestsRef.current.forEach((controller) => controller.abort());
      requestsRef.current.clear();
      setDataTicker("");
      setMarketData([]);
      setLoadingCount(0);
      setError(null);

      const activeTicker = activeTickerRef.current;
      if (!activeTicker) return;

      const to = new Date();
      const historyYears =
        nextInterval === MarketDataInterval.Monthly
          ? MONTHLY_INITIAL_RANGE_YEARS
          : INITIAL_RANGE_YEARS;
      const from = shiftYears(to, -historyYears);
      await requestRange(
        makeRequest(activeTicker, from, to, generation, nextInterval),
      );
    },
    [requestRange],
  );

  const loadMore = useCallback(
    (direction: MarketDataDirection) => {
      if (!ticker || !marketData.length) return;

      const oldest = toDate(marketData[0].time);
      const newest = toDate(marketData[marketData.length - 1].time);
      const today = new Date();
      if (Number.isNaN(oldest.getTime()) || Number.isNaN(newest.getTime())) return;

      let from: Date;
      let to: Date;

      if (direction === "older") {
        to = new Date(oldest.getTime() - MS_PER_DAY);
        from = shiftYears(to, -EXTENSION_YEARS);
      } else {
        from = new Date(newest.getTime() + MS_PER_DAY);
        to = today;
        if (from > to) return;
      }

      void requestRange(
        makeRequest(
          ticker,
          from,
          to,
          generationRef.current,
          activeIntervalRef.current,
        ),
      );
    },
    [marketData, requestRange, ticker],
  );

  const retry = useCallback(() => {
    const failedRequest = failedRequestRef.current;
    if (
      !failedRequest ||
      failedRequest.ticker !== activeTickerRef.current ||
      failedRequest.generation !== generationRef.current
    ) {
      return;
    }
    setError(null);
    requestedRangesRef.current.delete(failedRequest.key);
    completedRangesRef.current = completedRangesRef.current.filter(
      (range) =>
        !(
          range.generation === failedRequest.generation &&
          range.from === Date.parse(failedRequest.from) &&
          range.to === Date.parse(failedRequest.to)
        ),
    );
    void requestRange(failedRequest);
  }, [requestRange]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      requestsRef.current.forEach((controller) => controller.abort());
      requestsRef.current.clear();
    },
    [],
  );

  return {
    marketData,
    ticker,
    interval,
    dataTicker,
    isLoading: loadingCount > 0,
    error,
    loadTicker,
    changeInterval,
    loadMore,
    retry,
  };
}
