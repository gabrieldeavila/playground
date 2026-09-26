import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";

export const MARKET_DATA_INTERVAL_OPTIONS = [
  { value: MarketDataInterval.Daily, label: "Diário" },
  { value: MarketDataInterval.Weekly, label: "Semanal" },
  { value: MarketDataInterval.Monthly, label: "Mensal" },
] as const;
