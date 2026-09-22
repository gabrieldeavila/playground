import { memo, useEffect, useRef } from "react";

import { useTicketWorkspaceContext } from "../../../TicketWorkspace/context/context";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
} from "lightweight-charts";

import { MOCK_STOCK_DATA } from "@/types/consts/mock-stock-data.const";

const StockChartContent = memo(() => {
  const { ticketQuery, timeRange } = useTicketWorkspaceContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8d96a8",
        fontFamily: "Inter, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255, 255, 255, 0.08)" },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#61d6a3",
      downColor: "#f4778b",
      borderVisible: false,
      wickUpColor: "#61d6a3",
      wickDownColor: "#f4778b",
    });

    series.setData(MOCK_STOCK_DATA);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="stock-chart h-full w-full"
      aria-label={`Visualização de tickets ${timeRange}${ticketQuery ? ` para ${ticketQuery}` : ""}`}
    />
  );
});

StockChartContent.displayName = "StockChartContent";

export default StockChartContent;
