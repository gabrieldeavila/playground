import type { Dispatch, SetStateAction } from "react";

import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";
import type { MarketDataCandle } from "./market-data-candle.interface";

export type TicketWorkspaceBaseContextValue = {
  ticketQuery: string;
  timeRange: TicketTimeRange;
  setTicketQuery: Dispatch<SetStateAction<string>>;
  setTimeRange: Dispatch<SetStateAction<TicketTimeRange>>;
  marketData: MarketDataCandle[];
  setMarketData: Dispatch<SetStateAction<MarketDataCandle[]>>;
};
