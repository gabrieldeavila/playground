import { memo, useEffect, useRef } from "react";

import { useTicketWorkspaceContext } from "../../../TicketWorkspace/context/context";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
} from "lightweight-charts";

import { Button } from "@/ui/components/primitives/button";
import { Spinner } from "@/ui/components/primitives/spinner";
import { MOCK_STOCK_DATA } from "@/types/consts/mock-stock-data.const";
import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";

const toTimestamp = (time: string | number) => {
  if (typeof time === "number")
    return time > 10_000_000_000 ? time / 1000 : time;
  const timestamp = Date.parse(time);
  return Number.isNaN(timestamp) ? 0 : timestamp / 1000;
};

const StockChartContent = memo(() => {
  const {
    ticketQuery,
    timeRange,
    marketData,
    selectedTicker,
    dataTicker,
    isMarketDataLoading,
    marketDataError,
    loadMoreMarketData,
    retryMarketData,
  } = useTicketWorkspaceContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const updateChartDataRef = useRef<
    ((data: MarketDataCandle[]) => void) | null
  >(null);
  const loadMoreRef = useRef(loadMoreMarketData);
  const dataLengthRef = useRef(marketData.length);
  const previousDataRef = useRef<MarketDataCandle[]>([]);
  const renderedTickerRef = useRef("");

  loadMoreRef.current = loadMoreMarketData;
  dataLengthRef.current = marketData.length;

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
    series.setData(MOCK_STOCK_DATA as Parameters<typeof series.setData>[0]);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    updateChartDataRef.current = (data) => {
      series.setData(data as Parameters<typeof series.setData>[0]);
    };

    const handleVisibleRangeChange = () => {
      const visibleRange = chart.timeScale().getVisibleLogicalRange();
      if (!visibleRange || dataLengthRef.current === 0) return;

      const edgeThreshold = 5;
      if (visibleRange.from <= edgeThreshold) {
        loadMoreRef.current("older");
      }
      if (visibleRange.to >= dataLengthRef.current - 1 - edgeThreshold) {
        loadMoreRef.current("newer");
      }
    };

    chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    return () => {
      chart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      updateChartDataRef.current = null;
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      !dataTicker ||
      dataTicker !== selectedTicker ||
      marketData.length === 0
    ) {
      return;
    }

    const chart = chartRef.current;
    const updateChartData = updateChartDataRef.current;
    if (!chart || !updateChartData) return;

    const previousData = previousDataRef.current;
    const isNewTicker = renderedTickerRef.current !== dataTicker;
    const visibleRange = chart.timeScale().getVisibleLogicalRange();
    const previousFirstTime = previousData[0]
      ? toTimestamp(previousData[0].time)
      : Number.POSITIVE_INFINITY;
    const prependedCount = isNewTicker
      ? 0
      : marketData.filter(
          (candle) => toTimestamp(candle.time) < previousFirstTime,
        ).length;

    updateChartData(marketData);
    if (isNewTicker) {
      // Fit once for a newly selected symbol; incremental updates preserve the user's view.
      chart.timeScale().fitContent();
      renderedTickerRef.current = dataTicker;
    } else if (visibleRange) {
      chart.timeScale().setVisibleLogicalRange({
        from: visibleRange.from + prependedCount,
        to: visibleRange.to + prependedCount,
      });
    }

    previousDataRef.current = marketData;
  }, [dataTicker, marketData, selectedTicker]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="stock-chart h-full w-full"
        aria-label={`Visualização de tickets ${timeRange}${ticketQuery ? ` para ${ticketQuery}` : ""}`}
      />

      {isMarketDataLoading && (
        <div
          className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-(--radius-md) border border-border bg-bg-elevated/90 px-3 py-2 text-sm text-text-muted shadow-(--shadow-md)"
          role="status"
          aria-live="polite"
        >
          <Spinner size="sm" label="Carregando candles" />
          <span>Carregando candles</span>
        </div>
      )}

      {marketDataError && (
        <div
          className="absolute bottom-4 left-4 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-(--radius-md) border border-border bg-bg-elevated/95 px-3 py-2 text-sm text-text shadow-(--shadow-md)"
          role="alert"
        >
          <span>{marketDataError}</span>
          <Button size="sm" variant="secondary" onClick={retryMarketData}>
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
});

StockChartContent.displayName = "StockChartContent";

export default StockChartContent;
