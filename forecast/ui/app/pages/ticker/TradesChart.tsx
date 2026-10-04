import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type MouseEventParams,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { percent } from "../signals/shared";
import type { ChartTrade, TickerChart, Timeframe } from "../signals/signalsApi";

// Same palette as the Kandle chart, so both read the same way.
const UP = "#61d6a3";
const DOWN = "#f4778b";
const INK = "#f5f7fb";
const UP_DIM = "rgba(97, 214, 163, 0.4)";
const DOWN_DIM = "rgba(244, 119, 139, 0.4)";
const INK_DIM = "rgba(166, 173, 187, 0.5)";
const EMA_COLORS = { ema_9: "#72c9ff", ema_20: "#a88bff", ema_50: "#f5c66d" };
const EMAS = ["ema_9", "ema_20", "ema_50"] as const;
const BARS_PER_YEAR: Record<Timeframe, number> = { daily: 252, weekly: 52 };
// Candles kept around a trade when the chart scrolls to it.
const TRADE_PADDING = 30;

type Props = {
  chart: TickerChart;
  trades: ChartTrade[];
  selected: string | null;
  onSelect: (signalDate: string) => void;
};

const price = (value: number) => value.toFixed(2);

/** Buys at the entry candle, sells grouped by exit candle (several COMPRAs often exit together). */
const buildMarkers = (trades: ChartTrade[], selected: string | null) => {
  const markers: SeriesMarker<Time>[] = trades.map((trade) => ({
    id: `buy:${trade.signal_date}`,
    time: trade.entry_date as Time,
    position: "belowBar",
    shape: "arrowUp",
    color: trade.test ? INK : INK_DIM,
    text: String(trade.score),
    size: trade.signal_date === selected ? 2 : 1,
  }));
  const exits = new Map<string, ChartTrade[]>();
  for (const trade of trades) {
    if (!trade.exit_date) continue;
    exits.set(trade.exit_date, [...(exits.get(trade.exit_date) ?? []), trade]);
  }
  for (const [date, group] of exits) {
    const mean =
      group.reduce((sum, trade) => sum + trade.return_pct, 0) / group.length;
    const test = group.some((trade) => trade.test);
    markers.push({
      id: `sell:${date}`,
      time: date as Time,
      position: "aboveBar",
      shape: "arrowDown",
      color: mean >= 0 ? (test ? UP : UP_DIM) : test ? DOWN : DOWN_DIM,
      text: group.length === 1 ? percent(mean) : `${group.length}×`,
      size: group.some((trade) => trade.signal_date === selected) ? 2 : 1,
    });
  }
  return markers.sort((a, b) => String(a.time).localeCompare(String(b.time)));
};

export const TradesChart = memo(
  ({ chart, trades, selected, onSelect }: Props) => {
    const { t } = useTranslation("signals");
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<IChartApi | null>(null);
    const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const emaRefs = useRef<ISeriesApi<"Line">[]>([]);
    const bandRef = useRef<ISeriesApi<"Area"> | null>(null);
    const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
    const priceLinesRef = useRef<IPriceLine[]>([]);
    const [hovered, setHovered] = useState<number | null>(null);

    const { candles } = chart;
    const indexOf = useMemo(
      () => new Map(candles.time.map((time, index) => [time, index])),
      [candles],
    );
    // Latest values for the chart's event handlers, registered once.
    const latest = useRef({ chart, trades, onSelect });
    latest.current = { chart, trades, onSelect };

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      const api = createChart(container, {
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
        timeScale: { borderColor: "rgba(255, 255, 255, 0.08)" },
        handleScroll: { vertTouchDrag: false },
      });
      // Added first so it sits behind the candles; its own hidden 0–1 scale.
      bandRef.current = api.addSeries(AreaSeries, {
        priceScaleId: "training",
        lineVisible: false,
        topColor: "rgba(255, 255, 255, 0.05)",
        bottomColor: "rgba(255, 255, 255, 0.05)",
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => ({
          priceRange: { minValue: 0, maxValue: 1 },
        }),
      });
      api.priceScale("training").applyOptions({
        visible: false,
        scaleMargins: { top: 0, bottom: 0 },
      });
      const candleSeries = api.addSeries(CandlestickSeries, {
        upColor: UP,
        downColor: DOWN,
        borderVisible: false,
        wickUpColor: UP,
        wickDownColor: DOWN,
        // Its dotted last-price line would read as a stop.
        priceLineVisible: false,
      });
      candleRef.current = candleSeries;
      emaRefs.current = EMAS.map((ema) =>
        api.addSeries(LineSeries, {
          color: EMA_COLORS[ema],
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        }),
      );
      markersRef.current = createSeriesMarkers<Time>(candleSeries, []);

      const handleMove = (param: MouseEventParams<Time>) => {
        const size = latest.current.chart.candles.time.length;
        if (!param.point || param.logical == null) return setHovered(null);
        const index = Math.round(param.logical);
        setHovered(index >= 0 && index < size ? index : null);
      };
      const handleClick = (param: MouseEventParams<Time>) => {
        if (param.logical == null) return;
        const time =
          latest.current.chart.candles.time[Math.round(param.logical)];
        const trade = latest.current.trades.find(
          (item) => item.entry_date === time || item.exit_date === time,
        );
        if (trade) latest.current.onSelect(trade.signal_date);
      };
      api.subscribeCrosshairMove(handleMove);
      api.subscribeClick(handleClick);
      apiRef.current = api;
      return () => {
        api.unsubscribeCrosshairMove(handleMove);
        api.unsubscribeClick(handleClick);
        api.remove();
        apiRef.current = null;
        priceLinesRef.current = [];
      };
    }, []);

    // Candles, EMAs and the training band; opens on the last two years.
    useEffect(() => {
      const api = apiRef.current;
      if (!api || !candleRef.current || !bandRef.current) return;
      candleRef.current.setData(
        candles.time.map((time, index) => ({
          time: time as Time,
          open: candles.open[index],
          high: candles.high[index],
          low: candles.low[index],
          close: candles.close[index],
        })),
      );
      EMAS.forEach((ema, position) =>
        emaRefs.current[position]?.setData(
          candles.time.map((time, index) => {
            const value = candles[ema][index];
            return value == null
              ? { time: time as Time }
              : { time: time as Time, value };
          }),
        ),
      );
      bandRef.current.setData(
        candles.time
          .filter((time) => time < chart.test_start)
          .map((time) => ({ time: time as Time, value: 1 })),
      );
      const size = candles.time.length;
      api.timeScale().setVisibleLogicalRange({
        from: Math.max(0, size - 2 * BARS_PER_YEAR[chart.timeframe]),
        to: size + 5,
      });
    }, [candles, chart.test_start, chart.timeframe]);

    // Markers plus entry/exit/stop lines for the selected trade and stops of open ones.
    useEffect(() => {
      const series = candleRef.current;
      if (!series) return;
      markersRef.current?.setMarkers(buildMarkers(trades, selected));
      priceLinesRef.current.forEach((line) => series.removePriceLine(line));
      const lines: Parameters<typeof series.createPriceLine>[0][] = [];
      const pick = trades.find((trade) => trade.signal_date === selected);
      if (pick) {
        lines.push({
          price: pick.entry_price,
          color: INK,
          lineStyle: LineStyle.Dashed,
          title: t("chart.entry"),
        });
        if (pick.exit_date)
          lines.push({
            price: pick.exit_price,
            color: pick.return_pct >= 0 ? UP : DOWN,
            lineStyle: LineStyle.Dashed,
            title: t("chart.exit"),
          });
      }
      for (const trade of trades) {
        if (trade === pick || trade.exit_date == null)
          lines.push({
            price: trade.stop_price,
            color: DOWN,
            lineStyle: LineStyle.Dotted,
            title: t("chart.stop"),
          });
      }
      priceLinesRef.current = lines.map((line) =>
        series.createPriceLine({
          lineWidth: 1,
          axisLabelVisible: true,
          ...line,
        }),
      );
    }, [trades, selected, t]);

    // Bring the selected trade into view unless it already is.
    useEffect(() => {
      const api = apiRef.current;
      const pick = trades.find((trade) => trade.signal_date === selected);
      if (!api || !pick) return;
      const from = indexOf.get(pick.entry_date) ?? 0;
      const to = pick.exit_date
        ? (indexOf.get(pick.exit_date) ?? from)
        : candles.time.length - 1;
      const range = api.timeScale().getVisibleLogicalRange();
      if (range && range.from <= from && to <= range.to) return;
      api.timeScale().setVisibleLogicalRange({
        from: from - TRADE_PADDING,
        to: to + TRADE_PADDING,
      });
      // Only a new selection scrolls; filter changes leave the view alone.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    const index = hovered ?? candles.time.length - 1;
    const time = candles.time[index];
    const events = trades.filter(
      (trade) => trade.entry_date === time || trade.exit_date === time,
    );

    return (
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-2 z-10 flex flex-col gap-1 rounded-(--radius-sm) bg-(--color-bg)/80 px-2 py-1.5 text-xs tabular-nums text-(--color-text-muted)"
        >
          <div className="flex flex-wrap gap-x-3">
            <span className="text-(--color-text)">{time}</span>
            {(["open", "high", "low", "close"] as const).map((key) => (
              <span key={key}>
                {key[0].toUpperCase()}{" "}
                <span className="text-(--color-text)">
                  {price(candles[key][index])}
                </span>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-3">
            {EMAS.map((ema) => (
              <span key={ema} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: EMA_COLORS[ema] }}
                />
                EMA {ema.slice(4)}{" "}
                <span className="text-(--color-text)">
                  {candles[ema][index] == null
                    ? "—"
                    : price(candles[ema][index] as number)}
                </span>
              </span>
            ))}
          </div>
          {events.map((trade) =>
            trade.entry_date === time ? (
              <div
                key={`buy:${trade.signal_date}`}
                className="text-(--color-text)"
              >
                ▲ {t("chart.buy")} {price(trade.entry_price)} ·{" "}
                {t("columns.score")} {trade.score}
                {!trade.test && ` · ${t("chart.train")}`}
              </div>
            ) : (
              <div
                key={`sell:${trade.signal_date}`}
                className="text-(--color-text)"
              >
                ▼ {t("chart.sell")} {price(trade.exit_price)} ·{" "}
                <span
                  className={
                    trade.return_pct >= 0
                      ? "text-(--color-success)"
                      : "text-(--color-danger)"
                  }
                >
                  {percent(trade.return_pct)}
                </span>{" "}
                · {trade.days}{" "}
                {t("columns.days", { context: chart.timeframe }).toLowerCase()}{" "}
                · {trade.exit_reason ? t(`exit.${trade.exit_reason}`) : ""} ·{" "}
                {t("chart.buy")} {trade.entry_date}
              </div>
            ),
          )}
        </div>
        <div
          ref={containerRef}
          className="h-[380px] w-full sm:h-[520px]"
          role="img"
          aria-label={`${chart.ticker}: ${t("chart.tradesTitle")}`}
        />
      </div>
    );
  },
);

TradesChart.displayName = "TradesChart";
