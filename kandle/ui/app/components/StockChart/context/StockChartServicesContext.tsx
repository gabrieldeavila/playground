import { type ReactNode, useMemo } from "react";
import { StockChartServicesContext } from "./context";

export function StockChartServicesProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({}), []);

  return <StockChartServicesContext value={value}>{children}</StockChartServicesContext>;
}