import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";

export const WATCHLIST_STORAGE_KEY = "kandle:watchlist:v1";

const isTickerSuggestion = (value: unknown): value is TickerSuggestion =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  typeof value.label === "string" &&
  value.label.trim().length > 0 &&
  "value" in value &&
  typeof value.value === "string" &&
  /^[A-Z0-9^][A-Z0-9.^-]{0,14}$/i.test(value.value);

export const readWatchlistAssets = (): TickerSuggestion[] => {
  if (typeof window === "undefined") return [];

  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(WATCHLIST_STORAGE_KEY) ?? "null",
    );
    if (!Array.isArray(value)) return [];

    const assets = value
      .map((item): TickerSuggestion | null => {
        // Migra automaticamente a lista antiga de tickers em texto.
        if (
          typeof item === "string" &&
          /^[A-Z0-9^][A-Z0-9.^-]{0,14}$/i.test(item)
        ) {
          const ticker = item.toUpperCase();
          return { label: ticker, value: ticker };
        }
        if (!isTickerSuggestion(item)) return null;
        return {
          label: item.label.trim(),
          value: item.value.trim().toUpperCase(),
        };
      })
      .filter((asset): asset is TickerSuggestion => asset !== null);

    return [...new Map(assets.map((asset) => [asset.value, asset])).values()];
  } catch {
    return [];
  }
};

export const writeWatchlistAssets = (assets: TickerSuggestion[]): boolean => {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(assets));
    return true;
  } catch {
    return false;
  }
};
