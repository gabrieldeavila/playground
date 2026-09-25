import { type ReactNode, useEffect, useMemo, useState } from "react";

import type { HoveredCandle } from "@/types/interface/hovered-candle.interface";
import { TicketTimeRange } from "@/types/enum/ticket-time-range.enum";
import {
  readTicketWorkspaceStorage,
  writeTicketWorkspaceStorage,
} from "../features/ticketWorkspaceStorage";
import { useMarketData } from "../features/useMarketData";
import { TicketWorkspaceBaseContext } from "./context";

export function TicketWorkspaceBaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [persistedState] = useState(readTicketWorkspaceStorage);
  const [ticketQuery, setTicketQuery] = useState(
    persistedState?.ticketQuery ?? "",
  );
  const [timeRange, setTimeRange] = useState(TicketTimeRange.SevenDays);
  const [selectedEmaPeriods, setSelectedEmaPeriods] = useState<number[]>(
    persistedState?.selectedEmaPeriods ?? [50],
  );
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle | null>(
    null,
  );
  const {
    marketData,
    ticker: selectedTicker,
    dataTicker,
    isLoading: isMarketDataLoading,
    error: marketDataError,
    loadTicker,
    loadMore: loadMoreMarketData,
    retry: retryMarketData,
  } = useMarketData(persistedState ?? undefined);

  useEffect(() => {
    writeTicketWorkspaceStorage({
      ticketQuery,
      selectedTicker,
      dataTicker,
      marketData,
      selectedEmaPeriods,
    });
  }, [dataTicker, marketData, selectedEmaPeriods, selectedTicker, ticketQuery]);

  const value = useMemo(
    () => ({
      ticketQuery,
      timeRange,
      setTicketQuery,
      setTimeRange,
      hoveredCandle,
      setHoveredCandle,
      selectedEmaPeriods,
      setSelectedEmaPeriods,
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
      hoveredCandle,
      selectedEmaPeriods,
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
