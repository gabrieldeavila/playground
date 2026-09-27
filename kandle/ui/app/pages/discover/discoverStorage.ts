import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { DiscoveryResult } from "./useStockDiscovery";

export const DISCOVER_FILTERS_KEY = "kandle:discover:filters:v1";
export const DISCOVER_RESULTS_KEY = "kandle:discover:results:v1";

export type DiscoverFilters = {
  limit: number;
  dropLookback: string;
  minimumDrawdown: string;
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly;
  companyName: string;
  sector: string;
  businessType: string;
  minimumPrice: string;
  maximumPrice: string;
};

export type SavedDiscovery = {
  results: DiscoveryResult[];
  completed: number;
  total: number;
  limit: number;
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly;
  recentHighLookback: number;
  minimumDrawdownPercent: number;
  selectedEmaPeriods: number[];
  source?: string;
  updatedAt?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDiscoveryResult = (value: unknown): value is DiscoveryResult => {
  if (!isRecord(value) || !isRecord(value.asset)) return false;
  const { asset, status, opportunity, sector, industry } = value;
  if (
    typeof asset.label !== "string" ||
    typeof asset.value !== "string" ||
    (status !== "success" && status !== "error") ||
    (sector !== undefined && sector !== null && typeof sector !== "string") ||
    (industry !== undefined &&
      industry !== null &&
      typeof industry !== "string")
  )
    return false;
  if (status === "error") return true;
  if (opportunity === null) return true;
  if (!isRecord(opportunity)) return false;
  return (
    typeof opportunity.close === "number" &&
    Number.isFinite(opportunity.close) &&
    typeof opportunity.drawdownPercent === "number" &&
    Number.isFinite(opportunity.drawdownPercent) &&
    typeof opportunity.hasCurrentSelectedEmaPattern === "boolean"
  );
};

const isInterval = (value: unknown): value is SavedDiscovery["interval"] =>
  value === MarketDataInterval.Daily || value === MarketDataInterval.Weekly;

export const readDiscoverFilters = (): DiscoverFilters | null => {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(DISCOVER_FILTERS_KEY) ?? "null",
    );
    if (!isRecord(value)) return null;
    return {
      limit: [10, 25, 50].includes(Number(value.limit))
        ? Number(value.limit)
        : 25,
      dropLookback:
        typeof value.dropLookback === "string" ? value.dropLookback : "26",
      minimumDrawdown:
        typeof value.minimumDrawdown === "string"
          ? value.minimumDrawdown
          : "10",
      interval: isInterval(value.interval)
        ? value.interval
        : MarketDataInterval.Weekly,
      companyName:
        typeof value.companyName === "string" ? value.companyName : "",
      sector: typeof value.sector === "string" ? value.sector : "",
      businessType:
        typeof value.businessType === "string" ? value.businessType : "",
      minimumPrice:
        typeof value.minimumPrice === "string" ? value.minimumPrice : "",
      maximumPrice:
        typeof value.maximumPrice === "string" ? value.maximumPrice : "",
    };
  } catch {
    return null;
  }
};

export const writeDiscoverFilters = (filters: DiscoverFilters) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISCOVER_FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // Busca permanece utilizável se o armazenamento local estiver indisponível.
  }
};

export const readSavedDiscovery = (): SavedDiscovery | null => {
  if (typeof window === "undefined") return null;
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(DISCOVER_RESULTS_KEY) ?? "null",
    );
    if (
      !isRecord(value) ||
      !Array.isArray(value.results) ||
      !value.results.every(isDiscoveryResult) ||
      typeof value.completed !== "number" ||
      typeof value.total !== "number" ||
      typeof value.limit !== "number" ||
      !isInterval(value.interval) ||
      typeof value.recentHighLookback !== "number" ||
      typeof value.minimumDrawdownPercent !== "number" ||
      !Array.isArray(value.selectedEmaPeriods) ||
      !value.selectedEmaPeriods.every((period) => typeof period === "number")
    )
      return null;
    return value as unknown as SavedDiscovery;
  } catch {
    return null;
  }
};

export const writeSavedDiscovery = (discovery: SavedDiscovery) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DISCOVER_RESULTS_KEY,
      JSON.stringify(discovery),
    );
  } catch {
    // O resultado continua disponível na tela mesmo sem persistência.
  }
};

export const clearSavedDiscovery = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DISCOVER_RESULTS_KEY);
  } catch {
    // O estado da tela ainda pode ser limpo em memória.
  }
};
