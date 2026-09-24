import { memo, useEffect, useRef, useState } from "react";

import { useTicketWorkspaceContext } from "../../../TicketWorkspace/context/context";
import {
  CandlestickSeries,
  ColorType,
  LineSeries,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

import { Button } from "@/ui/components/primitives/button";
import { Select } from "@/ui/components/primitives/select";
import { Spinner } from "@/ui/components/primitives/spinner";
import { Switch } from "@/ui/components/primitives/switch";
import { MOCK_STOCK_DATA } from "@/types/consts/mock-stock-data.const";
import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";

const INITIAL_VISIBLE_CANDLES = 80;
const EMA_PERIODS = [9, 20, 50] as const;
const DEFAULT_EMA_PERIOD = 50;

type EmaPoint = { time: Time; value: number };

const calculateEma = (
  candles: MarketDataCandle[],
  period: number,
): EmaPoint[] => {
  if (candles.length < period) return [];

  const smoothingFactor = 2 / (period + 1);
  const initialAverage =
    candles.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) /
    period;
  const points: EmaPoint[] = [
    { time: candles[period - 1].time as Time, value: initialAverage },
  ];
  let previousEma = initialAverage;

  for (let index = period; index < candles.length; index += 1) {
    const close = candles[index].close;
    const value = close * smoothingFactor + previousEma * (1 - smoothingFactor);
    points.push({ time: candles[index].time as Time, value });
    previousEma = value;
  }

  return points;
};

const toTimestamp = (time: string | number) => {
  if (typeof time === "number")
    return time > 10_000_000_000 ? time / 1000 : time;
  const timestamp = Date.parse(time);
  return Number.isNaN(timestamp) ? 0 : timestamp / 1000;
};

const setInitialVisibleRange = (chart: IChartApi, candleCount: number) => {
  if (candleCount === 0) return;

  const lastIndex = candleCount - 1;
  chart.timeScale().setVisibleLogicalRange({
    from: Math.max(0, lastIndex - INITIAL_VISIBLE_CANDLES + 1),
    to: lastIndex,
  });
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
  const [isEmaEnabled, setIsEmaEnabled] = useState(true);
  const [emaPeriod, setEmaPeriod] = useState(DEFAULT_EMA_PERIOD);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const emaCacheRef = useRef<{
    ticker: string;
    period: number;
    candles: MarketDataCandle[];
    points: EmaPoint[];
  } | null>(null);
  const renderedEmaRef = useRef<{
    ticker: string;
    period: number;
    length: number;
  } | null>(null);
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
    candleSeriesRef.current = series;
    setInitialVisibleRange(chart, MOCK_STOCK_DATA.length);

    const emaSeries = chart.addSeries(LineSeries, {
      color: "#f5c66d",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
    });
    emaSeries.setData([]);
    emaSeriesRef.current = emaSeries;
    chartRef.current = chart;

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
      candleSeriesRef.current = null;
      emaSeriesRef.current = null;
      emaCacheRef.current = null;
      renderedEmaRef.current = null;
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
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const previousData = previousDataRef.current;
    const isNewTicker = renderedTickerRef.current !== dataTicker;
    const isAppend =
      !isNewTicker &&
      previousData.length > 0 &&
      marketData.length > previousData.length &&
      previousData.every((candle, index) => marketData[index] === candle);
    const visibleRange = chart.timeScale().getVisibleLogicalRange();
    let prependedCount = 0;

    if (isNewTicker) {
      candleSeries.setData(
        marketData as Parameters<typeof candleSeries.setData>[0],
      );
      // Show only the latest candles initially, keeping the full history available for pan/zoom.
      setInitialVisibleRange(chart, marketData.length);
      renderedTickerRef.current = dataTicker;
      emaCacheRef.current = null;
      renderedEmaRef.current = null;
    } else if (isAppend) {
      for (let index = previousData.length; index < marketData.length; index += 1) {
        candleSeries.update(marketData[index] as Parameters<typeof candleSeries.update>[0]);
      }
    } else if (marketData !== previousData) {
      prependedCount = Math.max(0, marketData.indexOf(previousData[0]));
      candleSeries.setData(
        marketData as Parameters<typeof candleSeries.setData>[0],
      );
    }

    if (!isNewTicker && !isAppend && visibleRange) {
      chart.timeScale().setVisibleLogicalRange({
        from: visibleRange.from + prependedCount,
        to: visibleRange.to + prependedCount,
      });
    }

    previousDataRef.current = marketData;
  }, [dataTicker, marketData, selectedTicker]);

  useEffect(() => {
    const emaSeries = emaSeriesRef.current;
    if (!emaSeries) return;

    const hasSelectedTickerData =
      dataTicker !== "" && dataTicker === selectedTicker;
    if (!isEmaEnabled || !hasSelectedTickerData || marketData.length === 0) {
      if (renderedEmaRef.current) {
        emaSeries.setData([]);
        renderedEmaRef.current = null;
      }
      return;
    }

    const cached = emaCacheRef.current;
    const cacheMatches =
      cached?.ticker === selectedTicker && cached.period === emaPeriod;
    const isCachedPrefix =
      cacheMatches &&
      cached.candles.length <= marketData.length &&
      cached.candles.every((candle, index) => marketData[index] === candle);

    if (isCachedPrefix && cached.candles.length === marketData.length) {
      const alreadyRendered =
        renderedEmaRef.current?.ticker === selectedTicker &&
        renderedEmaRef.current.period === emaPeriod &&
        renderedEmaRef.current.length === marketData.length;
      if (!alreadyRendered) {
        emaSeries.setData(cached.points);
        renderedEmaRef.current = {
          ticker: selectedTicker,
          period: emaPeriod,
          length: marketData.length,
        };
      }
      return;
    }

    const canExtend =
      isCachedPrefix && cached.candles.length >= emaPeriod && cached.points.length > 0;
    let emaPoints: EmaPoint[];
    if (canExtend) {
      const smoothingFactor = 2 / (emaPeriod + 1);
      let previousEma = cached.points[cached.points.length - 1].value;
      const appendedPoints: EmaPoint[] = [];
      for (let index = cached.candles.length; index < marketData.length; index += 1) {
        const candle = marketData[index];
        previousEma =
          candle.close * smoothingFactor + previousEma * (1 - smoothingFactor);
        appendedPoints.push({ time: candle.time as Time, value: previousEma });
      }
      emaPoints = [...cached.points, ...appendedPoints];

      const canUpdateVisibleSeries =
        renderedEmaRef.current?.ticker === selectedTicker &&
        renderedEmaRef.current.period === emaPeriod &&
        renderedEmaRef.current.length === cached.candles.length;
      if (canUpdateVisibleSeries) {
        appendedPoints.forEach((point) => emaSeries.update(point));
      } else {
        emaSeries.setData(emaPoints);
      }
    } else {
      emaPoints = calculateEma(marketData, emaPeriod);
      emaSeries.setData(emaPoints);
    }

    emaCacheRef.current = {
      ticker: selectedTicker,
      period: emaPeriod,
      candles: marketData,
      points: emaPoints,
    };
    renderedEmaRef.current = {
      ticker: selectedTicker,
      period: emaPeriod,
      length: marketData.length,
    };
  }, [dataTicker, emaPeriod, isEmaEnabled, marketData, selectedTicker]);

  return (
    <div className="relative h-full w-full">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 rounded-(--radius-md) border border-border bg-bg-elevated/95 px-3 py-2 shadow-(--shadow-md)">
        <span
          aria-hidden="true"
          className="h-0.5 w-4 rounded-full bg-[#f5c66d]"
        />
        <Switch
          label="EMA"
          checked={isEmaEnabled}
          onChange={(event) => setIsEmaEnabled(event.target.checked)}
        />
        <Select
          label="Período EMA"
          value={emaPeriod}
          onChange={(event) => setEmaPeriod(Number(event.target.value))}
          className="min-h-9 w-auto px-2.5 py-1.5"
        >
          {EMA_PERIODS.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </Select>
      </div>

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
