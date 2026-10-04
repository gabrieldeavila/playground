import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useParams, useSearchParams } from "react-router";

import { Alert } from "@/ui/components/primitives/alert";
import { Badge } from "@/ui/components/primitives/badge";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Spinner } from "@/ui/components/primitives/spinner";
import { Switch } from "@/ui/components/primitives/switch";
import { Table } from "@/ui/components/primitives/table";
import { cn } from "@/ui/helpers/cn";
import type { Route } from "./+types/index";
import { Score, Signed, SignalType } from "../signals/shared";
import {
  fetchChart,
  fetchTicker,
  type ChartTrade,
  type TickerChart,
  type TickerDetail,
  type Timeframe,
} from "../signals/signalsApi";
import { TradesChart } from "./TradesChart";

const TIMEFRAMES: Timeframe[] = ["daily", "weekly"];
// Minimum score options; 0 means every score.
const SCORE_FILTERS = [0, 50, 70, 90] as const;
type ScoreFilter = (typeof SCORE_FILTERS)[number];

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `${params.ticker?.toUpperCase()} · Sinais Kandle + IA` }];
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** Closed trades only: an open trade has no result yet. */
const summarize = (trades: ChartTrade[]) => {
  const closed = trades.filter((trade) => trade.exit_date);
  if (closed.length === 0) return null;
  return {
    trades: closed.length,
    winRate:
      (closed.filter((trade) => trade.return_pct > 0).length / closed.length) *
      100,
    meanReturn:
      closed.reduce((sum, trade) => sum + trade.return_pct, 0) / closed.length,
    medianDays: median(closed.map((trade) => trade.days)),
  };
};

const scoreLabel = (t: TFunction<"signals">, minScore: ScoreFilter) =>
  minScore === 0
    ? t("chart.scoreAll")
    : minScore === 90
      ? t("chart.scoreBand", { from: 90, to: 100 })
      : t("chart.scoreFrom", { score: minScore });

type SummaryProps = {
  /** Trades before the score filter, so the chosen band sits next to all scores. */
  trades: ChartTrade[];
  showTrain: boolean;
  minScore: ScoreFilter;
} & Pick<TickerChart, "timeframe">;

const Summary = memo(
  ({ trades, showTrain, minScore, timeframe }: SummaryProps) => {
    const { t } = useTranslation("signals");
    const scores = minScore === 0 ? [0 as const] : [0 as const, minScore];
    const periods = [
      { key: "test", label: t("chart.test"), test: true },
      ...(showTrain
        ? [{ key: "train", label: t("chart.train"), test: false }]
        : []),
    ].flatMap(({ key, label, test }) =>
      scores.map((score) => ({
        key: `${key}:${score}`,
        label: `${label} · ${scoreLabel(t, score)}`,
        trades: trades.filter((x) => x.test === test && x.score >= score),
      })),
    );
    return (
      <Card>
        <Card.Header>
          <Card.Title>{t("chart.summaryTitle")}</Card.Title>
        </Card.Header>
        <Card.Body className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>{t("chart.period")}</Table.Head>
                <Table.Head>{t("test.trades")}</Table.Head>
                <Table.Head>{t("test.winRate")}</Table.Head>
                <Table.Head>{t("test.meanReturn")}</Table.Head>
                <Table.Head>
                  {t("test.medianDays", { context: timeframe })}
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {periods.map(({ key, label, trades: rows }) => {
                const summary = summarize(rows);
                return (
                  <Table.Row key={key}>
                    <Table.Cell>{label}</Table.Cell>
                    <Table.Cell>{summary?.trades ?? 0}</Table.Cell>
                    <Table.Cell>
                      {summary ? `${summary.winRate.toFixed(1)}%` : "—"}
                    </Table.Cell>
                    <Table.Cell>
                      {summary ? <Signed value={summary.meanReturn} /> : "—"}
                    </Table.Cell>
                    <Table.Cell>{summary?.medianDays ?? "—"}</Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    );
  },
);

Summary.displayName = "Summary";

type TradesTableProps = {
  trades: ChartTrade[];
  selected: string | null;
  onSelect: (signalDate: string) => void;
  timeframe: Timeframe;
};

const TradesTable = memo(
  ({ trades, selected, onSelect, timeframe }: TradesTableProps) => {
    const { t } = useTranslation("signals");
    const rows = useMemo(
      () =>
        [...trades].sort((a, b) => b.signal_date.localeCompare(a.signal_date)),
      [trades],
    );
    return (
      <Card className="min-w-0">
        <Card.Header>
          <Card.Title>{t("chart.tradesTitle")}</Card.Title>
          <p className="text-sm text-(--color-text-muted)">
            {t("chart.tradesDescription")}
          </p>
        </Card.Header>
        <Card.Body className="max-h-[560px] overflow-auto">
          {rows.length === 0 ? (
            <p className="text-sm text-(--color-text-muted)">
              {t("chart.noTrades")}
            </p>
          ) : (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>{t("columns.signal")}</Table.Head>
                  <Table.Head>{t("columns.score")}</Table.Head>
                  <Table.Head>{t("chart.entry")}</Table.Head>
                  <Table.Head>{t("chart.exit")}</Table.Head>
                  <Table.Head>
                    {t("columns.days", { context: timeframe })}
                  </Table.Head>
                  <Table.Head>{t("columns.result")}</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((trade) => (
                  <Table.Row
                    key={trade.signal_date}
                    aria-selected={trade.signal_date === selected}
                    className={cn(
                      "cursor-pointer",
                      trade.signal_date === selected &&
                        "bg-(--color-surface-3)",
                      !trade.test && "opacity-60",
                    )}
                    onClick={() => onSelect(trade.signal_date)}
                  >
                    <Table.Cell className="whitespace-nowrap">
                      <div>{trade.signal_date}</div>
                      <div className="mt-1 flex gap-1">
                        <SignalType trendStart={trade.trend_start} />
                        {!trade.test && (
                          <Badge size="sm" variant="default">
                            {t("chart.train")}
                          </Badge>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <Score value={trade.score} />
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums">
                      <div>{trade.entry_date}</div>
                      <div className="text-xs text-(--color-text-muted)">
                        {trade.entry_price.toFixed(2)}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap tabular-nums">
                      <div>{trade.exit_date ?? t("exit.open")}</div>
                      <div className="text-xs text-(--color-text-muted)">
                        {trade.exit_reason
                          ? `${trade.exit_price.toFixed(2)} · ${t(`exit.${trade.exit_reason}`)}`
                          : `${t("chart.stop")} ${trade.stop_price.toFixed(2)}`}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{trade.days}</Table.Cell>
                    <Table.Cell>
                      <Signed value={trade.return_pct} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  },
);

TradesTable.displayName = "TradesTable";

const Legend = ({ testStart }: { testStart: string }) => {
  const { t } = useTranslation("signals");
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-(--color-text-muted)">
      <span>
        <span className="text-(--color-text)">▲ 87</span> {t("chart.legendBuy")}
      </span>
      <span>
        <span className="text-[#61d6a3]">▼ +5.2%</span> /{" "}
        <span className="text-[#f4778b]">▼ −3.1%</span> {t("chart.legendSell")}
      </span>
      <span>
        <span className="text-[#f4778b]">┈┈</span> {t("chart.legendOpen")}
      </span>
      <span className="basis-full">
        {t("chart.trainNote", { date: testStart })}
      </span>
    </div>
  );
};

const Ticker = memo(() => {
  const { t } = useTranslation("signals");
  const params = useParams();
  const ticker = (params.ticker ?? "").toUpperCase();
  const [searchParams, setSearchParams] = useSearchParams();
  const timeframe: Timeframe =
    searchParams.get("timeframe") === "weekly" ? "weekly" : "daily";
  const [chart, setChart] = useState<TickerChart | null>(null);
  const [detail, setDetail] = useState<TickerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrain, setShowTrain] = useState(false);
  const [onlyTrendStarts, setOnlyTrendStarts] = useState(false);
  const [minScore, setMinScore] = useState<ScoreFilter>(0);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setSelected(null);
    void Promise.all([
      fetchChart(ticker, timeframe),
      // Name and index only; a ticker missing from the snapshot still has a chart.
      fetchTicker(ticker, timeframe).catch(() => null),
    ])
      .then(([nextChart, nextDetail]) => {
        if (!current) return;
        setChart(nextChart);
        setDetail(nextDetail);
        setError(null);
      })
      .catch((loadError: Error) => {
        if (!current) return;
        setChart(null);
        setError(loadError.message);
      })
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [ticker, timeframe]);

  const unscored = useMemo(
    () =>
      (chart?.trades ?? []).filter(
        (trade) =>
          (showTrain || trade.test) && (!onlyTrendStarts || trade.trend_start),
      ),
    [chart, showTrain, onlyTrendStarts],
  );
  const trades = useMemo(
    () => unscored.filter((trade) => trade.score >= minScore),
    [unscored, minScore],
  );
  const chartRef = useRef<HTMLDivElement>(null);
  const select = useCallback(
    (signalDate: string) => setSelected(signalDate),
    [],
  );
  // The table sits below the chart: bring the chart back into view to show the trade.
  const selectFromTable = useCallback((signalDate: string) => {
    setSelected(signalDate);
    chartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to="/signals"
              className="inline-flex items-center gap-1 text-sm text-(--color-text-muted) hover:text-(--color-text)"
            >
              <FiArrowLeft aria-hidden="true" />
              {t("chart.back")}
            </Link>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {ticker}
              {detail?.name && (
                <span className="ml-3 text-lg font-normal text-(--color-text-muted)">
                  {detail.name}
                </span>
              )}
            </h1>
            <p className="mt-2 text-sm text-(--color-text-muted)">
              {[
                detail?.index && t(`index.${detail.index}`),
                detail?.sector,
                chart &&
                  t("chart.subtitle", {
                    from: chart.candles.time[0],
                    session: chart.session,
                  }),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div
            role="group"
            aria-label={t("timeframe.label")}
            className="flex gap-1"
          >
            {TIMEFRAMES.map((frame) => (
              <Button
                key={frame}
                size="sm"
                variant={timeframe === frame ? "primary" : "ghost"}
                aria-pressed={timeframe === frame}
                onClick={() => setSearchParams({ timeframe: frame })}
              >
                {t(`timeframe.${frame}`)}
              </Button>
            ))}
          </div>
        </header>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading && !chart ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          chart && (
            <>
              <Card ref={chartRef} className="min-w-0 scroll-mt-4">
                <Card.Header>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <Switch
                      checked={showTrain}
                      onChange={(event) => setShowTrain(event.target.checked)}
                      label={t("chart.showTrain", { date: chart.test_start })}
                    />
                    <Switch
                      checked={onlyTrendStarts}
                      onChange={(event) =>
                        setOnlyTrendStarts(event.target.checked)
                      }
                      label={t("chart.onlyTrendStarts")}
                    />
                    <div
                      role="group"
                      aria-label={t("columns.score")}
                      className="flex flex-wrap items-center gap-1"
                    >
                      {SCORE_FILTERS.map((score) => (
                        <Button
                          key={score}
                          size="sm"
                          variant={minScore === score ? "secondary" : "ghost"}
                          aria-pressed={minScore === score}
                          onClick={() => setMinScore(score)}
                        >
                          {scoreLabel(t, score)}
                        </Button>
                      ))}
                    </div>
                    <span className="text-sm text-(--color-text-muted)">
                      {t("chart.trades", { count: trades.length })}
                    </span>
                    {loading && <Spinner size="sm" />}
                  </div>
                </Card.Header>
                <Card.Body className="flex flex-col gap-3">
                  <TradesChart
                    chart={chart}
                    trades={trades}
                    selected={selected}
                    onSelect={select}
                  />
                  <Legend testStart={chart.test_start} />
                </Card.Body>
              </Card>
              <Summary
                trades={unscored}
                showTrain={showTrain}
                minScore={minScore}
                timeframe={chart.timeframe}
              />
              <TradesTable
                trades={trades}
                selected={selected}
                onSelect={selectFromTable}
                timeframe={chart.timeframe}
              />
            </>
          )
        )}
      </div>
    </main>
  );
});

Ticker.displayName = "Ticker";

export default Ticker;
