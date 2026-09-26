import type { Dispatch, SetStateAction } from "react";

import { MarketDataInterval } from "@/types/enum/market-data-interval.enum";
import type { HoveredCandle } from "./hovered-candle.interface";
import type { MarketDataCandle } from "./market-data-candle.interface";

export type TicketWorkspaceBaseContextValue = {
  ticketQuery: string;
  selectedInterval: MarketDataInterval;
  setTicketQuery: Dispatch<SetStateAction<string>>;
  setSelectedInterval: (interval: MarketDataInterval) => void;
  hoveredCandle: HoveredCandle | null;
  setHoveredCandle: Dispatch<SetStateAction<HoveredCandle | null>>;
  marketData: MarketDataCandle[];
  selectedEmaPeriods: number[];
  setSelectedEmaPeriods: Dispatch<SetStateAction<number[]>>;
  selectedTicker: string;
  dataTicker: string;
  isMarketDataLoading: boolean;
  marketDataError: string | null;
  loadTicker: (ticker: string) => Promise<void>;
  loadMoreMarketData: (direction: "older" | "newer") => void;
  retryMarketData: () => void;
};
