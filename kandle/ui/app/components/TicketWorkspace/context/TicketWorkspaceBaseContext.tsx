import { type ReactNode, useMemo, useState } from "react";

import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";

import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";
import { TicketWorkspaceBaseContext } from "./context";

export function TicketWorkspaceBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ticketQuery, setTicketQuery] = useState("");
  const [timeRange, setTimeRange] = useState(TicketTimeRange.SevenDays);
  const [marketData, setMarketData] = useState<MarketDataCandle[]>([]);

  const value = useMemo(
    () => ({
      ticketQuery,
      timeRange,
      setTicketQuery,
      setTimeRange,
      marketData,
      setMarketData,
    }),
    [ticketQuery, timeRange, marketData],
  );

  return (
    <TicketWorkspaceBaseContext value={value}>
      {children}
    </TicketWorkspaceBaseContext>
  );
}
