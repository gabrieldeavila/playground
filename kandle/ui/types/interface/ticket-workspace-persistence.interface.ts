import type { MarketDataInterval } from "../enum/market-data-interval.enum";
import type { MarketDataCandle } from "./market-data-candle.interface";

export interface TicketWorkspacePersistence {
  interval?: MarketDataInterval;
  ticketQuery: string;
  selectedTicker: string;
  dataTicker: string;
  marketData: MarketDataCandle[];
  selectedEmaPeriods: number[];
}
