import type { Dispatch, SetStateAction } from "react";

import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";
import type { MarketDataCandle } from "./market-data-candle.interface";

export type TicketWorkspaceBaseContextValue = {
  ticketQuery: string;
  timeRange: TicketTimeRange;
  setTicketQuery: Dispatch<SetStateAction<string>>;
  setTimeRange: Dispatch<SetStateAction<TicketTimeRange>>;
  marketData: MarketDataCandle[];
  selectedTicker: string;
  dataTicker: string;
  isMarketDataLoading: boolean;
  marketDataError: string | null;
  loadTicker: (ticker: string) => Promise<void>;
  loadMoreMarketData: (direction: "older" | "newer") => void;
  retryMarketData: () => void;
};
