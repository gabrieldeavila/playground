import { useEffect, useState } from "react";

import { fetchTicker, type TickerDetail, type Timeframe } from "../signalsApi";

/** History of the selected ticker, refetched when the timeframe changes. */
export const useTickerDetail = (
  timeframe: Timeframe,
  onError: (message: string | null) => void,
) => {
  const [ticker, setTicker] = useState<string | null>(null);
  const [detail, setDetail] = useState<TickerDetail | null>(null);

  useEffect(() => {
    if (!ticker) return;
    let current = true;
    fetchTicker(ticker, timeframe)
      .then((next) => {
        if (!current) return;
        setDetail(next);
        onError(null);
      })
      .catch((detailError: Error) => {
        if (!current) return;
        setDetail(null);
        onError(detailError.message);
      });
    return () => {
      current = false;
    };
  }, [ticker, timeframe, onError]);

  return { detail, select: setTicker };
};
