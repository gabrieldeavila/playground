import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  const [searchParams, setSearchParams] = useSearchParams();
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
    document.title = selectedTicker
      ? `Kandle - (${selectedTicker}) Gráfico de ações`
      : "Kandle - Gráfico de ações";
  }, [selectedTicker]);

  useEffect(() => {
    if (!requestedTicker) return;
    setTicketQuery(requestedTicker);
    void loadTicker(requestedTicker);
  }, [loadTicker, requestedTicker]);

  // Persisted candles are only a display cache; refresh them once on load.
  useEffect(() => {
    if (!requestedTicker && persistedState?.selectedTicker) {
      void loadTicker(persistedState.selectedTicker);
    }
  }, []);

  const selectTicker = useCallback(
    (ticker: string) => {
      // A leftover ?ticker= would override this choice on the next reload.
      if (searchParams.has("ticker")) {
        setSearchParams(
          (params) => {
            const nextParams = new URLSearchParams(params);
            nextParams.delete("ticker");
            return nextParams;
          },
          { replace: true },
        );
      }
      return loadTicker(ticker);
    },
    [loadTicker, searchParams, setSearchParams],
  );

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
      loadTicker: selectTicker,
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
      selectTicker,
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
