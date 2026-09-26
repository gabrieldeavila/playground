import { memo, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";

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
  type CandlestickData,
  type MouseEventParams,
} from "lightweight-charts";

import { Button } from "@/ui/components/primitives/button";
import { Checkbox } from "@/ui/components/primitives/checkbox";
import { FiCrosshair, FiX } from "react-icons/fi";
import { Spinner } from "@/ui/components/primitives/spinner";
import { MOCK_STOCK_DATA } from "@/types/consts/mock-stock-data.const";
import type { HoveredCandle } from "@/types/interface/hovered-candle.interface";
import type { MarketDataCandle } from "@/types/interface/market-data-candle.interface";

const INITIAL_VISIBLE_CANDLES = 80;
const EMA_PERIODS = [9, 20, 50, 100, 200] as const;

const getCandleTimeKey = (time: HoveredCandle["time"]) =>
  typeof time === "object"
    ? `${String(time.year).padStart(4, "0")}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`
    : typeof time === "string"
      ? time.slice(0, 10)
      : String(time);
const EMA_COLORS: Record<(typeof EMA_PERIODS)[number], string> = {
  9: "#72c9ff",
  20: "#a88bff",
  50: "#f5c66d",
  100: "#ff8f70",
  200: "#61d6a3",
};

type EmaPeriod = (typeof EMA_PERIODS)[number];
type EmaPoint = { time: Time; value: number };
type PriceMeasurementPoint = { time: Time; price: number };
type EmaCache = {
  ticker: string;
  period: EmaPeriod;
  candles: MarketDataCandle[];
  points: EmaPoint[];
};

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
    hoveredCandle,
    setHoveredCandle,
    marketData,
    selectedEmaPeriods,
    setSelectedEmaPeriods,
    selectedTicker,
    dataTicker,
    isMarketDataLoading,
    marketDataError,
    loadMoreMarketData,
    retryMarketData,
  } = useTicketWorkspaceContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const emaSeriesRef = useRef(new Map<EmaPeriod, ISeriesApi<"Line">>());
  const emaCacheRef = useRef(new Map<EmaPeriod, EmaCache>());
  const renderedEmaRef = useRef(
    new Map<EmaPeriod, { ticker: string; length: number }>(),
  );
  const loadMoreRef = useRef(loadMoreMarketData);
  const dataLengthRef = useRef(marketData.length);
  const candleDataRef = useRef<HoveredCandle[]>(MOCK_STOCK_DATA);
  const previousDataRef = useRef<MarketDataCandle[]>([]);
  const renderedTickerRef = useRef("");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementStart, setMeasurementStart] =
    useState<PriceMeasurementPoint | null>(null);
  const [measurementEnd, setMeasurementEnd] =
    useState<PriceMeasurementPoint | null>(null);
  const [, setMeasureRevision] = useState(0);

  loadMoreRef.current = loadMoreMarketData;
  dataLengthRef.current = marketData.length;
  candleDataRef.current =
    dataTicker === selectedTicker && marketData.length > 0
      ? marketData
      : MOCK_STOCK_DATA;

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
    chartRef.current = chart;

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param.time) {
        setHoveredCandle(null);
        return;
      }

      const candle = param.seriesData.get(series);
      if (candle && "open" in candle) {
        const hovered = candle as HoveredCandle;
        const candleIndex = candleDataRef.current.findIndex(
          (item) => getCandleTimeKey(item.time) === getCandleTimeKey(hovered.time),
        );
        const previousClose =
          candleIndex > 0 ? candleDataRef.current[candleIndex - 1].close : null;
        const changePercent =
          previousClose !== null && previousClose !== 0
            ? ((hovered.close - previousClose) / previousClose) * 100
            : undefined;

        setHoveredCandle({ ...hovered, changePercent });
      } else {
        setHoveredCandle(null);
      }
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const handleVisibleRangeChange = () => {
      setMeasureRevision((revision) => revision + 1);
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
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      candleSeriesRef.current = null;
      emaSeriesRef.current.clear();
      emaCacheRef.current.clear();
      renderedEmaRef.current.clear();
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
      setInitialVisibleRange(chart, marketData.length);
      renderedTickerRef.current = dataTicker;
      emaCacheRef.current.clear();
      renderedEmaRef.current.clear();
    } else if (isAppend) {
      for (
        let index = previousData.length;
        index < marketData.length;
        index += 1
      ) {
        candleSeries.update(
          marketData[index] as Parameters<typeof candleSeries.update>[0],
        );
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
    const hasSelectedTickerData =
      dataTicker !== "" &&
      dataTicker === selectedTicker &&
      marketData.length > 0;
    if (!hasSelectedTickerData) {
      emaSeriesRef.current.forEach((series) => series.setData([]));
      renderedEmaRef.current.clear();
      return;
    }

    const chart = chartRef.current;
    if (!chart) return;

    const selectedPeriods = new Set(selectedEmaPeriods);
    EMA_PERIODS.forEach((period) => {
      let series = emaSeriesRef.current.get(period);
      if (selectedPeriods.has(period) && !series) {
        series = chart.addSeries(LineSeries, {
          color: EMA_COLORS[period],
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true,
          crosshairMarkerVisible: true,
        });
        emaSeriesRef.current.set(period, series);
      }

      if (!series) return;
      if (!selectedPeriods.has(period)) {
        series.setData([]);
        renderedEmaRef.current.delete(period);
        return;
      }

      const cached = emaCacheRef.current.get(period);
      const cacheMatches =
        cached?.ticker === selectedTicker && cached.period === period;
      const isCachedPrefix =
        cacheMatches &&
        cached.candles.length <= marketData.length &&
        cached.candles.every((candle, index) => marketData[index] === candle);

      if (isCachedPrefix && cached.candles.length === marketData.length) {
        const rendered = renderedEmaRef.current.get(period);
        const alreadyRendered =
          rendered?.ticker === selectedTicker &&
          rendered.length === marketData.length;
        if (!alreadyRendered) {
          series.setData(cached.points);
          renderedEmaRef.current.set(period, {
            ticker: selectedTicker,
            length: marketData.length,
          });
        }
        return;
      }

      const canExtend =
        isCachedPrefix &&
        cached.candles.length >= period &&
        cached.points.length > 0;
      let emaPoints: EmaPoint[];
      if (canExtend) {
        const smoothingFactor = 2 / (period + 1);
        let previousEma = cached.points[cached.points.length - 1].value;
        const appendedPoints: EmaPoint[] = [];
        for (
          let index = cached.candles.length;
          index < marketData.length;
          index += 1
        ) {
          const candle = marketData[index];
          previousEma =
            candle.close * smoothingFactor +
            previousEma * (1 - smoothingFactor);
          appendedPoints.push({
            time: candle.time as Time,
            value: previousEma,
          });
        }
        emaPoints = [...cached.points, ...appendedPoints];

        const rendered = renderedEmaRef.current.get(period);
        const canUpdateVisibleSeries =
          rendered?.ticker === selectedTicker &&
          rendered.length === cached.candles.length;
        if (canUpdateVisibleSeries) {
          appendedPoints.forEach((point) => series.update(point));
        } else {
          series.setData(emaPoints);
        }
      } else {
        emaPoints = calculateEma(marketData, period);
        series.setData(emaPoints);
      }

      emaCacheRef.current.set(period, {
        ticker: selectedTicker,
        period,
        candles: marketData,
        points: emaPoints,
      });
      renderedEmaRef.current.set(period, {
        ticker: selectedTicker,
        length: marketData.length,
      });
    });
  }, [dataTicker, marketData, selectedEmaPeriods, selectedTicker]);

  const toggleEmaPeriod = (period: EmaPeriod, checked: boolean) => {
    setSelectedEmaPeriods((current) =>
      checked
        ? [...current, period].sort((left, right) => left - right)
        : current.filter((selectedPeriod) => selectedPeriod !== period),
    );
  };

  const getMeasurementPoint = (
    clientX: number,
    clientY: number,
  ): PriceMeasurementPoint | null => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const container = containerRef.current;
    if (!chart || !candleSeries || !container) return null;

    const bounds = container.getBoundingClientRect();
    const x = clientX - bounds.left - chart.priceScale("right").width();
    const y = clientY - bounds.top;
    const paneSize = chart.paneSize();
    if (x < 0 || x > paneSize.width || y < 0 || y > paneSize.height) {
      return null;
    }

    const time = chart.timeScale().coordinateToTime(x);
    const price = candleSeries.coordinateToPrice(y);
    if (time === null || price === null) return null;
    return { time, price };
  };

  const handleMeasurementClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isMeasuring) return;
    const point = getMeasurementPoint(event.clientX, event.clientY);
    if (!point) return;

    if (!measurementStart) {
      setMeasurementStart(point);
      setMeasurementEnd(point);
      return;
    }

    setMeasurementEnd(point);
    setIsMeasuring(false);
  };

  const handleMeasurementMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isMeasuring || !measurementStart) return;
    const point = getMeasurementPoint(event.clientX, event.clientY);
    if (point) setMeasurementEnd(point);
  };

  const toggleMeasuring = () => {
    if (!isMeasuring) {
      setMeasurementStart(null);
      setMeasurementEnd(null);
      setIsMeasuring(true);
      return;
    }
    setIsMeasuring(false);
  };

  const chart = chartRef.current;
  const candleSeries = candleSeriesRef.current;
  const scaleWidth = chart?.priceScale("right").width() ?? 0;
  const startX = measurementStart && chart
    ? chart.timeScale().timeToCoordinate(measurementStart.time)
    : null;
  const startY = measurementStart && candleSeries
    ? candleSeries.priceToCoordinate(measurementStart.price)
    : null;
  const endX = measurementEnd && chart
    ? chart.timeScale().timeToCoordinate(measurementEnd.time)
    : null;
  const endY = measurementEnd && candleSeries
    ? candleSeries.priceToCoordinate(measurementEnd.price)
    : null;
  const hasMeasurementCoordinates =
    startX !== null && startX !== undefined &&
    startY !== null && startY !== undefined &&
    endX !== null && endX !== undefined &&
    endY !== null && endY !== undefined;
  const priceDifference =
    measurementStart && measurementEnd
      ? measurementEnd.price - measurementStart.price
      : 0;
  const percentageDifference = measurementStart
    ? (priceDifference / measurementStart.price) * 100
    : 0;
  const numberFormat = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
        <Button
          size="sm"
          variant={isMeasuring ? "primary" : "secondary"}
          aria-pressed={isMeasuring}
          onClick={toggleMeasuring}
          leftIcon={<FiCrosshair />}
        >
          {isMeasuring ? "Medindo…" : "Medir variação"}
        </Button>
        {measurementStart && (
          <Button
            size="sm"
            variant="ghost"
            aria-label="Limpar medição de preço"
            onClick={() => {
              setMeasurementStart(null);
              setMeasurementEnd(null);
              setIsMeasuring(false);
            }}
            leftIcon={<FiX />}
          >
            Limpar
          </Button>
        )}
      </div>

      {isMeasuring && (
        <div
          className="absolute inset-0 z-10 cursor-crosshair"
          aria-label={
            measurementStart
              ? "Escolha o ponto final da medição"
              : "Escolha o ponto inicial da medição"
          }
          onClick={handleMeasurementClick}
          onMouseMove={handleMeasurementMove}
        />
      )}

      {hasMeasurementCoordinates && measurementStart && measurementEnd && (
        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <line
            x1={startX + scaleWidth}
            y1={startY}
            x2={endX + scaleWidth}
            y2={endY}
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeDasharray={isMeasuring ? "5 4" : undefined}
          />
          <circle cx={startX + scaleWidth} cy={startY} r="4" fill="var(--color-primary)" />
          <circle cx={endX + scaleWidth} cy={endY} r="4" fill="var(--color-primary)" />
          <foreignObject
            x={(startX + endX) / 2 + scaleWidth + 12}
            y={(startY + endY) / 2 - 30}
            width="180"
            height="60"
          >
            <div className="rounded-(--radius-md) border border-border bg-bg-elevated/95 px-3 py-2 text-xs text-text shadow-(--shadow-md)">
              <div className="font-semibold">
                {priceDifference >= 0 ? "+" : ""}{numberFormat.format(priceDifference)}
              </div>
              <div className="text-text-muted">
                {percentageDifference >= 0 ? "+" : ""}{numberFormat.format(percentageDifference)}%
              </div>
            </div>
          </foreignObject>
        </svg>
      )}

      <fieldset className="absolute right-4 top-4 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-(--radius-md) border border-border bg-bg-elevated/95 px-3 py-2 shadow-(--shadow-md)">
        <legend className="sr-only">Médias móveis exponenciais</legend>
        <span className="text-sm font-medium text-text-muted">EMA</span>
        {EMA_PERIODS.map((period) => (
          <Checkbox
            key={period}
            label={String(period)}
            aria-label={`Exibir EMA de ${period} períodos`}
            checked={selectedEmaPeriods.includes(period)}
            checkedColor={EMA_COLORS[period]}
            onChange={(event) => toggleEmaPeriod(period, event.target.checked)}
            className="items-center gap-1 text-xs"
          />
        ))}
      </fieldset>

      <div
        ref={containerRef}
        className="stock-chart h-full w-full"
        aria-label={`Visualização de tickets ${timeRange}${ticketQuery ? ` para ${ticketQuery}` : ""}`}
      />

      {isMarketDataLoading && (
        <div
          className="pointer-events-none absolute left-4 top-16 flex items-center gap-2 rounded-(--radius-md) border border-border bg-bg-elevated/90 px-3 py-2 text-sm text-text-muted shadow-(--shadow-md)"
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
