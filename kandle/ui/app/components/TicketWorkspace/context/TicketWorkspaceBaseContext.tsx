import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import type { HoveredCandle } from "@/types/interface/hovered-candle.interface";
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
  const [searchParams] = useSearchParams();
  const requestedTicker = searchParams.get("ticker")?.trim() ?? "";
  const [persistedState] = useState(readTicketWorkspaceStorage);
  const [ticketQuery, setTicketQuery] = useState(
    persistedState?.ticketQuery ?? "",
  );
  const [selectedEmaPeriods, setSelectedEmaPeriods] = useState<number[]>(
    persistedState?.selectedEmaPeriods ?? [50],
  );
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle | null>(
    null,
  );
  const {
    marketData,
    ticker: selectedTicker,
    interval: selectedInterval,
    dataTicker,
    isLoading: isMarketDataLoading,
    error: marketDataError,
    loadTicker,
    changeInterval: setSelectedInterval,
    loadMore: loadMoreMarketData,
    retry: retryMarketData,
  } = useMarketData(persistedState ?? undefined);

  useEffect(() => {
    if (!requestedTicker) return;
    setTicketQuery(requestedTicker);
    void loadTicker(requestedTicker);
  }, [loadTicker, requestedTicker]);

  useEffect(() => {
    writeTicketWorkspaceStorage({
      ticketQuery,
      selectedTicker,
      interval: selectedInterval,
      dataTicker,
      marketData,
      selectedEmaPeriods,
    });
  }, [
    dataTicker,
    marketData,
    selectedEmaPeriods,
    selectedInterval,
    selectedTicker,
    ticketQuery,
  ]);

  const value = useMemo(
    () => ({
      ticketQuery,
      selectedInterval,
      setTicketQuery,
      setSelectedInterval,
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
      selectedInterval,
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
