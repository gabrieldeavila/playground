import { useCallback, useEffect, useRef, useState } from "react";

import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";
import {
  fetchWatchlistSignal,
  getCachedWatchlistSignal,
  type WatchlistSignalResult,
} from "./watchlistSignals";
import { type WatchlistInterval } from "./watchlist";

export type WatchlistSignalState =
  | { status: "loading" }
  | { status: "success"; result: WatchlistSignalResult }
  | { status: "error"; message: string };

type SignalTask = { ticker: string; interval: WatchlistInterval };

const REQUESTS_PER_BATCH = 3;
const BATCH_PAUSE_MS = 500;
const signalKey = (ticker: string, interval: WatchlistInterval) =>
  `${interval}:${ticker}`;

export function useWatchlistSignals(
  assets: TickerSuggestion[],
  enabled: boolean,
  interval: WatchlistInterval,
) {
  const [states, setStates] = useState<Record<string, WatchlistSignalState>>(
    {},
  );
  const statesRef = useRef(states);
  const intervalRef = useRef(interval);
  intervalRef.current = interval;
  const queueRef = useRef<SignalTask[]>([]);
  const queuedRef = useRef(new Set<string>());
  const requestedRef = useRef(new Set<string>());
  const controllersRef = useRef(new Set<AbortController>());
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(false);
  const pumpRef = useRef<() => void>(() => undefined);

  const updateSignal = useCallback(
    (key: string, state: WatchlistSignalState) => {
      statesRef.current = { ...statesRef.current, [key]: state };
      setStates(statesRef.current);
    },
    [],
  );

  pumpRef.current = () => {
    if (isProcessingRef.current || !isMountedRef.current) return;
    isProcessingRef.current = true;

    void (async () => {
      let requestsInBatch = 0;
      try {
        while (queueRef.current.length > 0 && isMountedRef.current) {
          const task = queueRef.current.shift();
          if (!task) continue;
          const key = signalKey(task.ticker, task.interval);
          queuedRef.current.delete(key);

          // Não inicia buscas antigas que ainda estavam na fila após trocar o período.
          if (task.interval !== intervalRef.current) {
            requestedRef.current.delete(key);
            continue;
          }

          const controller = new AbortController();
          controllersRef.current.add(controller);
          try {
            const result = await fetchWatchlistSignal(
              task.ticker,
              task.interval,
              controller.signal,
            );
            if (isMountedRef.current) {
              updateSignal(key, { status: "success", result });
            }
          } catch {
            if (isMountedRef.current && !controller.signal.aborted) {
              updateSignal(key, {
                status: "error",
                message: "Não foi possível carregar o sinal. Tente novamente.",
              });
            }
          } finally {
            controllersRef.current.delete(controller);
          }

          requestsInBatch += 1;
          if (
            requestsInBatch >= REQUESTS_PER_BATCH &&
            queueRef.current.length > 0
          ) {
            requestsInBatch = 0;
            await new Promise((resolve) =>
              window.setTimeout(resolve, BATCH_PAUSE_MS),
            );
          }
        }
      } finally {
        isProcessingRef.current = false;
        if (queueRef.current.length > 0 && isMountedRef.current) {
          pumpRef.current();
        }
      }
    })();
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controllersRef.current.forEach((controller) => controller.abort());
      controllersRef.current.clear();
      queueRef.current = [];
      queuedRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    assets.forEach(({ value }) => {
      const ticker = value.toUpperCase();
      const key = signalKey(ticker, interval);
      if (
        statesRef.current[key]?.status === "success" ||
        queuedRef.current.has(key) ||
        requestedRef.current.has(key)
      ) {
        return;
      }

      const cachedResult = getCachedWatchlistSignal(ticker, interval);
      if (cachedResult) {
        updateSignal(key, { status: "success", result: cachedResult });
        requestedRef.current.add(key);
        return;
      }

      requestedRef.current.add(key);
      queuedRef.current.add(key);
      queueRef.current.push({ ticker, interval });
      updateSignal(key, { status: "loading" });
    });
    pumpRef.current();
  }, [assets, enabled, interval, updateSignal]);

  const retry = useCallback(
    (ticker: string) => {
      const normalizedTicker = ticker.toUpperCase();
      const key = signalKey(normalizedTicker, interval);
      requestedRef.current.delete(key);
      updateSignal(key, { status: "loading" });
      requestedRef.current.add(key);
      queuedRef.current.add(key);
      queueRef.current.push({ ticker: normalizedTicker, interval });
      pumpRef.current();
    },
    [interval, updateSignal],
  );

  const signals = Object.fromEntries(
    assets.map(({ value }) => [
      value.toUpperCase(),
      states[signalKey(value.toUpperCase(), interval)],
    ]),
  ) as Record<string, WatchlistSignalState | undefined>;

  return { signals, retry };
}
