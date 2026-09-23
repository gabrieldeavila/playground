import axios from "axios";
import { useCallback, useState } from "react";

import type {
  MarketDataCandle,
  MarketDataRecord,
  MarketDataResponse,
} from "@/types/interface/market-data-candle.interface";

const toChartTime = (value: string | number): string | number => {
  if (typeof value === "number") {
    return value > 10_000_000_000 ? Math.floor(value / 1000) : value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : Math.floor(timestamp / 1000);
};

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
    .map((candle: MarketDataRecord) => {
      const time = candle.time ?? candle.timestamp ?? candle.datetime ?? candle.date;
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

      return {
        time: toChartTime(time),
        open,
        high,
        low,
        close,
        ...(candle.volume !== undefined ? { volume: Number(candle.volume) } : {}),
      };
    })
    .filter((candle): candle is MarketDataCandle => candle !== null)
    .sort((first, second) =>
      String(first.time).localeCompare(String(second.time)),
    );

export function useMarketData() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMarketData = useCallback(async (ticker: string) => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

    if (!apiUrl || !ticker.trim()) return [];

    setIsLoading(true);

    try {
      const { data } = await axios.get<MarketDataResponse>(
        `${apiUrl}/market-data/${encodeURIComponent(ticker)}`,
        { params: { range: "1y", interval: "1wk" } },
      );
      return normalizeCandles(data);
    } catch {
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchMarketData, isLoading };
}
