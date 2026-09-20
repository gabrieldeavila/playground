import type { StockChartBaseContextValue, StockChartServicesContextValue } from "@/types/interface/stockchart-context.interface";
import { createContext, useContext } from "react";

export const StockChartBaseContext = createContext<StockChartBaseContextValue | null>(null);

export const StockChartServicesContext =
  createContext<StockChartServicesContextValue | null>(null);

export const useStockChartBaseContext = () => {
  const context = useContext(StockChartBaseContext);

  if (!context) {
    throw new Error("useStockChartBaseContext must be used within a StockChartBaseContext");
  }

  return context;
};

export const useStockChartServicesContext = () => {
  const context = useContext(StockChartServicesContext);

  if (!context) {
    throw new Error(
      "useStockChartServicesContext must be used within a StockChartServicesContext",
    );
  }

  return context;
};