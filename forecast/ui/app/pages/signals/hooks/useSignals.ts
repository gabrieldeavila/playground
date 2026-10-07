import { useCallback, useEffect, useState } from "react";

import {
  fetchSignals,
  fetchTickers,
  type SignalsResponse,
  type TickerOption,
  type Timeframe,
} from "../signalsApi";

/** Snapshot and search options for a timeframe, reloaded whenever it changes. */
export const useSignals = (timeframe: Timeframe) => {
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [tickers, setTickers] = useState<TickerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [signals, options] = await Promise.all([
        fetchSignals(timeframe),
        fetchTickers(timeframe),
      ]);
      setData(signals);
      setTickers(options);
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, tickers, loading, error, setError, reload };
};
