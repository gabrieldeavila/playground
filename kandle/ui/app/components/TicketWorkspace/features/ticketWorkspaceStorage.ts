import { TICKET_WORKSPACE_STORAGE_KEY } from "@/types/consts/ticket-workspace-storage-key.const";
import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";
import type { TicketWorkspacePersistence } from "@/types/interface/ticket-workspace-persistence.interface";

const isCandle = (value: unknown): value is MarketDataCandle => {
  if (!value || typeof value !== "object") return false;

  const candle = value as Record<string, unknown>;
  return (
    (typeof candle.time === "string" || typeof candle.time === "number") &&
    ["open", "high", "low", "close"].every(
      (key) => typeof candle[key] === "number" && Number.isFinite(candle[key]),
    ) &&
    (candle.volume === undefined ||
      (typeof candle.volume === "number" && Number.isFinite(candle.volume)))
  );
};

export const readTicketWorkspaceStorage =
  (): TicketWorkspacePersistence | null => {
    if (typeof window === "undefined") return null;

    try {
      const rawValue = window.localStorage.getItem(
        TICKET_WORKSPACE_STORAGE_KEY,
      );
      if (!rawValue) return null;

      const value: unknown = JSON.parse(rawValue);
      if (!value || typeof value !== "object") return null;

      const persisted = value as Record<string, unknown>;
      if (
        typeof persisted.ticketQuery !== "string" ||
        typeof persisted.selectedTicker !== "string" ||
        typeof persisted.dataTicker !== "string" ||
        !Array.isArray(persisted.marketData) ||
        !persisted.marketData.every(isCandle)
      ) {
        return null;
      }

      const validEmaPeriods = [9, 20, 50, 100, 200];
      const selectedEmaPeriods = Array.isArray(persisted.selectedEmaPeriods)
        ? [
            ...new Set(
              persisted.selectedEmaPeriods.filter(
                (period): period is number =>
                  typeof period === "number" &&
                  validEmaPeriods.includes(period),
              ),
            ),
          ].sort((left, right) => left - right)
        : [50];

      return {
        ticketQuery: persisted.ticketQuery,
        selectedTicker: persisted.selectedTicker,
        dataTicker: persisted.dataTicker,
        marketData: persisted.marketData,
        selectedEmaPeriods,
      };
    } catch {
      return null;
    }
  };

export const writeTicketWorkspaceStorage = (
  value: TicketWorkspacePersistence,
) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      TICKET_WORKSPACE_STORAGE_KEY,
      JSON.stringify(value),
    );
  } catch {
    // Storage can be unavailable or full; the workspace remains usable in memory.
  }
};
