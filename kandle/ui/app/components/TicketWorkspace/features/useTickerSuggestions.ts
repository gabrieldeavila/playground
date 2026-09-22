import axios from "axios";
import { useEffect, useState } from "react";

const SEARCH_DEBOUNCE_MS = 300;

export function useTickerSuggestions(query: string, enabled = true) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!enabled || !normalizedQuery) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
        const { data } = await axios.get<string[]>(
          `${apiUrl}/market-data/search`,
          {
            params: { q: normalizedQuery },
            signal: controller.signal,
          },
        );

        setSuggestions(data);
      } catch (error) {
        if (!axios.isCancel(error)) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [enabled, query]);

  return { suggestions, isLoading };
}
