import axios from "axios";
import { useCallback, useState } from "react";

export function useMarketData() {
  const [isLoading, setIsLoading] = useState(false);

  const fetchMarketData = useCallback(async (ticker: string) => {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

    if (!apiUrl || !ticker.trim()) return;

    setIsLoading(true);

    try {
      await axios.get(`${apiUrl}/market-data/${encodeURIComponent(ticker)}`, {
        params: {
          range: "1d",
          interval: "5m",
        },
      });
    } catch {
      // The consumer can continue using the selected ticker if the request fails.
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchMarketData, isLoading };
}
