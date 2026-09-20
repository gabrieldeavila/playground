import { type ReactNode, useMemo } from "react";
import { StockChartBaseContext } from "./context";

export function StockChartBaseProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({}), []);

  return <StockChartBaseContext value={value}>{children}</StockChartBaseContext>;
}