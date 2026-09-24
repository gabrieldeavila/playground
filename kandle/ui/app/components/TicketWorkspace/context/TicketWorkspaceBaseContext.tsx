import { type ReactNode, useMemo, useState } from "react";

import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";
import { useMarketData } from "../features/useMarketData";
import { TicketWorkspaceBaseContext } from "./context";

export function TicketWorkspaceBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [ticketQuery, setTicketQuery] = useState("");
  const [timeRange, setTimeRange] = useState(TicketTimeRange.SevenDays);
  const {
    marketData,
    ticker: selectedTicker,
    dataTicker,
    isLoading: isMarketDataLoading,
    error: marketDataError,
    loadTicker,
    loadMore: loadMoreMarketData,
    retry: retryMarketData,
  } = useMarketData();

  const value = useMemo(
    () => ({
      ticketQuery,
      timeRange,
      setTicketQuery,
      setTimeRange,
      marketData,
      selectedTicker,
      dataTicker,
      isMarketDataLoading,
      marketDataError,
      loadTicker,
      loadMoreMarketData,
      retryMarketData,
    }),
    [
      ticketQuery,
      timeRange,
      marketData,
      selectedTicker,
      dataTicker,
      isMarketDataLoading,
      marketDataError,
      loadTicker,
      loadMoreMarketData,
      retryMarketData,
    ],
  );

  return (
    <TicketWorkspaceBaseContext value={value}>
      {children}
    </TicketWorkspaceBaseContext>
  );
}
