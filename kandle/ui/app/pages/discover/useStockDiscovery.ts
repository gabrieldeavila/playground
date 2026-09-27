import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";

import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { MarketDataResponse } from "@/types/interface/market-data-candle.interface";
import type { TickerSuggestion } from "@/types/interface/ticker-suggestion.interface";
import { normalizeMarketCandles } from "../watchlist/watchlist";
import {
  readSavedDiscovery,
  writeSavedDiscovery,
  type SavedDiscovery,
} from "./discoverStorage";
import {
  classifyOpportunity,
  DEFAULT_OPPORTUNITY_CRITERIA,
  getOpportunityHistoryRange,
  type Opportunity,
} from "../opportunities/opportunities";

type UniverseResponse = {
  source: string;
  updatedAt: string;
  assets: unknown[];
};

type ParsedUniverse = Omit<UniverseResponse, "assets"> & {
  assets: TickerSuggestion[];
};

export type DiscoveryResult = {
  asset: TickerSuggestion;
  status: "pending" | "success" | "error";
  opportunity?: Opportunity | null;
  sector?: string | null;
  industry?: string | null;
};

type CompanyProfile = { sector: string | null; industry: string | null };

async function fetchCompanyProfile(ticker: string, signal: AbortSignal) {
  const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!apiUrl) return { sector: null, industry: null };
  try {
    const { data } = await axios.get<unknown>(
      `${apiUrl}/market-data/profile/${encodeURIComponent(ticker)}`,
      { signal },
    );
    if (typeof data !== "object" || data === null) {
      return { sector: null, industry: null };
    }
    const profile = data as Partial<CompanyProfile>;
    return {
      sector: typeof profile.sector === "string" ? profile.sector : null,
      industry: typeof profile.industry === "string" ? profile.industry : null,
    };
  } catch {
    return { sector: null, industry: null };
  }
}

type DiscoveryState = {
  status: "idle" | "loading-universe" | "scanning" | "complete" | "error";
  results: DiscoveryResult[];
  completed: number;
  total: number;
  limit?: number;
  interval?: DiscoveryInterval;
  recentHighLookback?: number;
  minimumDrawdownPercent?: number;
  selectedEmaPeriods?: number[];
  source?: string;
  updatedAt?: string;
  message?: string;
};

type DiscoveryInterval =
  | typeof MarketDataInterval.Daily
  | typeof MarketDataInterval.Weekly;
type CachedDiscovery = { checkedAt: number; result: Opportunity | null };
const CACHE_KEY = "kandle:stock-discovery:v6";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const BATCH_SIZE = 3;
const TICKER_PATTERN = /^[A-Z0-9^][A-Z0-9.^-]{0,14}$/i;

const readCache = (): Record<string, CachedDiscovery> => {
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
        const cached = entry as Partial<CachedDiscovery>;
        return (
          typeof cached.checkedAt === "number" &&
          now - cached.checkedAt < CACHE_TTL_MS
        );
      }),
    ) as Record<string, CachedDiscovery>;
  } catch {
    return {};
  }
};

const parseUniverse = (value: unknown): ParsedUniverse => {
  if (typeof value !== "object" || value === null)
    throw new Error("A fonte retornou uma lista inválida.");
  const response = value as Partial<UniverseResponse>;
  if (
    typeof response.source !== "string" ||
    typeof response.updatedAt !== "string" ||
    !Array.isArray(response.assets)
  ) {
    throw new Error("A fonte retornou uma lista inválida.");
  }
  const assets = response.assets.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const asset = item as Partial<TickerSuggestion>;
    if (typeof asset.label !== "string" || typeof asset.value !== "string")
      return [];
    const label = asset.label.trim();
    const ticker = asset.value.trim().toUpperCase();
    return label && TICKER_PATTERN.test(ticker)
      ? [{ label, value: ticker }]
      : [];
  });
  if (assets.length === 0)
    throw new Error("A fonte não retornou ações válidas.");
  return { source: response.source, updatedAt: response.updatedAt, assets };
};

async function fetchOpportunity(
  ticker: string,
  interval: DiscoveryInterval,
  recentHighLookback: number,
  minimumDrawdownPercent: number,
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
    {
      ...DEFAULT_OPPORTUNITY_CRITERIA,
      recentHighLookback,
      minimumDrawdownPercent,
    },
    selectedEmaPeriods,
  );
}

const discoveryCacheKey = (
  ticker: string,
  interval: DiscoveryInterval,
  recentHighLookback: number,
  minimumDrawdownPercent: number,
  selectedEmaPeriods: readonly number[],
) =>
  `${interval}:${recentHighLookback}:${minimumDrawdownPercent}:${[...selectedEmaPeriods].sort((a, b) => a - b).join(",") || "none"}:${ticker}`;

const saveCachedResult = (
  ticker: string,
  interval: DiscoveryInterval,
  recentHighLookback: number,
  minimumDrawdownPercent: number,
  selectedEmaPeriods: readonly number[],
  result: Opportunity | null,
) => {
  if (typeof window === "undefined") return;
  try {
    const cache = readCache();
    cache[
      discoveryCacheKey(
        ticker,
        interval,
        recentHighLookback,
        minimumDrawdownPercent,
        selectedEmaPeriods,
      )
    ] = {
      checkedAt: Date.now(),
      result,
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // O resultado continua disponível na tela quando o cache não está acessível.
  }
};

export function useStockDiscovery() {
  const [state, setState] = useState<DiscoveryState>({
    status: "idle",
    results: [],
    completed: 0,
    total: 0,
  });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = readSavedDiscovery();
    if (saved) setState({ status: "complete", ...saved });
    return () => controllerRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState({ status: "idle", results: [], completed: 0, total: 0 });
  }, []);

  const scan = useCallback(
    async (options: {
      limit: number;
      companyName: string;
      interval: DiscoveryInterval;
      recentHighLookback: number;
      minimumDrawdownPercent: number;
      selectedEmaPeriods: number[];
      sector: string;
      businessType: string;
      minimumPrice: string;
      maximumPrice: string;
    }) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState({
        status: "loading-universe",
        results: [],
        completed: 0,
        total: 0,
        interval: options.interval,
        recentHighLookback: options.recentHighLookback,
        minimumDrawdownPercent: options.minimumDrawdownPercent,
        selectedEmaPeriods: options.selectedEmaPeriods,
      });

      try {
        const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
        if (!apiUrl) throw new Error("A URL da API não está configurada.");
        const response = await axios.get<unknown>(
          `${apiUrl}/market-data/universe/russell-2000`,
          {
            signal: controller.signal,
          },
        );
        const universe = parseUniverse(response.data);
        const nameQuery = options.companyName.trim().toLocaleLowerCase("pt-BR");
        const candidates = universe.assets.filter(
          (asset) =>
            !nameQuery ||
            asset.label.toLocaleLowerCase("pt-BR").includes(nameQuery),
        );

        if (candidates.length === 0) {
          const completedDiscovery: SavedDiscovery = {
            results: [],
            completed: 0,
            total: 0,
            limit: options.limit,
            interval: options.interval,
            recentHighLookback: options.recentHighLookback,
            minimumDrawdownPercent: options.minimumDrawdownPercent,
            selectedEmaPeriods: options.selectedEmaPeriods,
            source: universe.source,
            updatedAt: universe.updatedAt,
          };
          writeSavedDiscovery(completedDiscovery);
          setState({ status: "complete", ...completedDiscovery });
          return;
        }

        const minimum = options.minimumPrice === "" ? null : Number(options.minimumPrice);
        const maximum = options.maximumPrice === "" ? null : Number(options.maximumPrice);
        const normalizedBusinessType = options.businessType
          .trim()
          .toLocaleLowerCase("pt-BR");
        const matchesFilters = (result: DiscoveryResult) => {
          const opportunity = result.opportunity;
          if (
            result.status !== "success" ||
            !opportunity ||
            opportunity.drawdownPercent <
              options.minimumDrawdownPercent ||
            !opportunity.hasCurrentSelectedEmaPattern
          )
            return false;
          const price = opportunity.close;
          return (
            (minimum === null || price >= minimum) &&
            (maximum === null || price <= maximum) &&
            (!options.sector || result.sector === options.sector) &&
            (!normalizedBusinessType ||
              result.industry?.toLocaleLowerCase("pt-BR").includes(normalizedBusinessType))
          );
        };
        const scannedResults: DiscoveryResult[] = [];
        setState({
          status: "scanning",
          results: [],
          completed: 0,
          total: candidates.length,
          limit: options.limit,
          interval: options.interval,
          recentHighLookback: options.recentHighLookback,
          minimumDrawdownPercent: options.minimumDrawdownPercent,
          selectedEmaPeriods: options.selectedEmaPeriods,
          source: universe.source,
          updatedAt: universe.updatedAt,
        });

        for (let index = 0; index < candidates.length; index += BATCH_SIZE) {
          if (controller.signal.aborted) return;
          const batch = candidates.slice(index, index + BATCH_SIZE);
          const cache = readCache();
          const batchResults = await Promise.all(
            batch.map(async (asset): Promise<DiscoveryResult> => {
              const profilePromise = fetchCompanyProfile(
                asset.value,
                controller.signal,
              );
              try {
                const cached = cache[
                  discoveryCacheKey(
                    asset.value,
                    options.interval,
                    options.recentHighLookback,
                    options.minimumDrawdownPercent,
                    options.selectedEmaPeriods,
                  )
                ];
                const [opportunity, profile] = await Promise.all([
                  cached
                    ? Promise.resolve(cached.result)
                    : fetchOpportunity(
                        asset.value,
                        options.interval,
                        options.recentHighLookback,
                        options.minimumDrawdownPercent,
                        options.selectedEmaPeriods,
                        controller.signal,
                      ),
                  profilePromise,
                ]);
                if (!cached)
                  saveCachedResult(
                    asset.value,
                    options.interval,
                    options.recentHighLookback,
                    options.minimumDrawdownPercent,
                    options.selectedEmaPeriods,
                    opportunity,
                  );
                return {
                  asset,
                  status: "success",
                  opportunity,
                  sector: profile.sector,
                  industry: profile.industry,
                };
              } catch {
                return { asset, status: "error" };
              }
            }),
          );
          if (controller.signal.aborted) return;
          scannedResults.push(...batchResults);
          setState((current) => ({
            ...current,
            results: [...scannedResults],
            completed: scannedResults.length,
          }));

          if (scannedResults.filter(matchesFilters).length >= options.limit) break;
        }
        if (!controller.signal.aborted)
          setState((current) => {
            const completed: SavedDiscovery = {
              results: current.results.filter(matchesFilters).slice(0, options.limit),
              completed: current.completed,
              total: current.total,
              limit: current.limit ?? options.limit,
              interval: current.interval ?? options.interval,
              recentHighLookback:
                current.recentHighLookback ?? options.recentHighLookback,
              minimumDrawdownPercent:
                current.minimumDrawdownPercent ?? options.minimumDrawdownPercent,
              selectedEmaPeriods:
                current.selectedEmaPeriods ?? options.selectedEmaPeriods,
              source: current.source,
              updatedAt: current.updatedAt,
            };
            writeSavedDiscovery(completed);
            return { status: "complete", ...completed };
          });
      } catch {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            results: [],
            completed: 0,
            total: 0,
            interval: options.interval,
            recentHighLookback: options.recentHighLookback,
            message:
              "Não foi possível carregar o universo de ações. Tente novamente mais tarde.",
          });
        }
      }
    },
    [],
  );

  return { state, scan, clear };
}
