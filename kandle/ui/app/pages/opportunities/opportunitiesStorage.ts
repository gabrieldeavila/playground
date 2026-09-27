import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import {
  DEFAULT_OPPORTUNITY_CRITERIA,
  type OpportunityCriteria,
} from "./opportunities";

export const OPPORTUNITIES_PREFERENCES_KEY =
  "kandle:opportunities:preferences:v1";

export type OpportunitiesPreferences = {
  interval: typeof MarketDataInterval.Daily | typeof MarketDataInterval.Weekly;
  backtestTicker: string;
  backtestFrom: string;
  backtestTo: string;
  criteria: OpportunityCriteria;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isValidDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};

const isValidTicker = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Z0-9^][A-Z0-9.^-]{0,14}$/i.test(value);

const readCriteria = (value: unknown): OpportunityCriteria => {
  if (!isRecord(value)) return DEFAULT_OPPORTUNITY_CRITERIA;

  const drawdown = value.minimumDrawdownPercent;
  const highLookback = value.recentHighLookback;
  const slopeLookback = value.emaSlopeLookback;

  return {
    minimumDrawdownPercent:
      typeof drawdown === "number" && Number.isFinite(drawdown)
        ? Math.min(100, Math.max(0, drawdown))
        : DEFAULT_OPPORTUNITY_CRITERIA.minimumDrawdownPercent,
    recentHighLookback:
      typeof highLookback === "number" && Number.isFinite(highLookback)
        ? Math.round(Math.min(500, Math.max(1, highLookback)))
        : DEFAULT_OPPORTUNITY_CRITERIA.recentHighLookback,
    emaSlopeLookback:
      typeof slopeLookback === "number" && Number.isFinite(slopeLookback)
        ? Math.round(Math.min(100, Math.max(1, slopeLookback)))
        : DEFAULT_OPPORTUNITY_CRITERIA.emaSlopeLookback,
  };
};

export const readOpportunitiesPreferences =
  (): Partial<OpportunitiesPreferences> => {
    if (typeof window === "undefined") return {};

    try {
      const parsed: unknown = JSON.parse(
        window.localStorage.getItem(OPPORTUNITIES_PREFERENCES_KEY) ?? "null",
      );
      if (!isRecord(parsed)) return {};

      const interval =
        parsed.interval === MarketDataInterval.Daily ||
        parsed.interval === MarketDataInterval.Weekly
          ? parsed.interval
          : undefined;
      const backtestTicker = isValidTicker(parsed.backtestTicker)
        ? parsed.backtestTicker.toUpperCase()
        : undefined;
      const backtestFrom = isValidDate(parsed.backtestFrom)
        ? parsed.backtestFrom
        : undefined;
      const backtestTo = isValidDate(parsed.backtestTo)
        ? parsed.backtestTo
        : undefined;

      return {
        ...(interval ? { interval } : {}),
        ...(backtestTicker ? { backtestTicker } : {}),
        ...(backtestFrom ? { backtestFrom } : {}),
        ...(backtestTo ? { backtestTo } : {}),
        criteria: readCriteria(parsed.criteria),
      };
    } catch {
      return {};
    }
  };

export const writeOpportunitiesPreferences = (
  preferences: OpportunitiesPreferences,
): boolean => {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      OPPORTUNITIES_PREFERENCES_KEY,
      JSON.stringify(preferences),
    );
    return true;
  } catch {
    return false;
  }
};
