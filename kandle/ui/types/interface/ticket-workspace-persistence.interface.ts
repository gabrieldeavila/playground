import type { MarketDataCandle } from "./market-data-candle.interface";

export interface TicketWorkspacePersistence {
  ticketQuery: string;
  selectedTicker: string;
  dataTicker: string;
  marketData: MarketDataCandle[];
}
