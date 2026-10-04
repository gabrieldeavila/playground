import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { FiRefreshCw } from "react-icons/fi";

import { Alert } from "@/ui/components/primitives/alert";
import { Badge, type BadgeVariant } from "@/ui/components/primitives/badge";
import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Spinner } from "@/ui/components/primitives/spinner";
import { Table } from "@/ui/components/primitives/table";
import {
  fetchRefreshStatus,
  fetchSignals,
  fetchTicker,
  fetchTickers,
  startRefresh,
  type MarketIndex,
  type ModelSummary,
  type SignalsResponse,
  type TickerDetail,
  type TickerOption,
  type Timeframe,
} from "./signalsApi";
import { TickerSearch } from "./TickerSearch";

const percent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const rate = (value: number | null) =>
  value == null ? "—" : `${value.toFixed(1)}%`;

const Signed = ({ value }: { value: number }) => (
  <span
    className={
      value >= 0 ? "text-(--color-success)" : "text-(--color-danger)"
    }
  >
    {percent(value)}
  </span>
);

const scoreVariant = (score: number): BadgeVariant =>
  score >= 70 ? "success" : score >= 50 ? "warning" : "default";

/** Score badge plus the real win rate its band had in the test period. */
const Score = ({
  value,
  winRate,
}: {
  value: number;
  winRate: number | null;
}) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap">
    <Badge size="sm" variant={scoreVariant(value)}>
      {value}
    </Badge>
    {winRate != null && (
      <span className="text-xs text-(--color-text-muted)">
        {Math.round(winRate)}%
      </span>
    )}
  </span>
);

/** Trend start = first COMPRA after a base; sideways = repeated COMPRA in chop. */
const SignalType = ({ trendStart }: { trendStart: boolean }) => {
  const { t } = useTranslation("signals");
  return (
    <Badge
      size="sm"
      variant={trendStart ? "success" : "default"}
      className="whitespace-nowrap"
    >
      {trendStart ? t("type.trendStart") : t("type.sideways")}
    </Badge>
  );
};

const OutcomeRow = ({
  label,
  row,
}: {
  label: ReactNode;
  row: { trades: number; win_rate_pct: number; mean_return_pct: number; median_days: number };
}) => (
  <Table.Row>
    <Table.Cell>{label}</Table.Cell>
    <Table.Cell>{row.trades}</Table.Cell>
    <Table.Cell>{row.win_rate_pct.toFixed(1)}%</Table.Cell>
    <Table.Cell>
      <Signed value={row.mean_return_pct} />
    </Table.Cell>
    <Table.Cell>{row.median_days}</Table.Cell>
  </Table.Row>
);

const TIMEFRAMES: Timeframe[] = ["daily", "weekly"];
const INDEXES: MarketIndex[] = [
  "sp500",
  "sp400",
  "sp600",
  "r2000",
  "watchlist",
  "other",
];

export function meta() {
  return [{ title: "Sinais Kandle + IA" }];
}

type ModelTestProps = { model: ModelSummary; timeframe: Timeframe };

const ModelTest = memo(({ model, timeframe }: ModelTestProps) => {
  const { t } = useTranslation("signals");
  return (
    <Card>
      <Card.Header>
        <Card.Title>{t("test.title")}</Card.Title>
        <p className="text-sm text-(--color-text-muted)">
          {t("test.description", {
            train: model.train_signals,
            test: model.test_signals,
          })}
        </p>
      </Card.Header>
      <Card.Body className="space-y-4 overflow-x-auto">
        {[
          {
            heading: t("test.type"),
            rows: model.test_by_type.map((row) => ({
              key: row.type,
              label:
                row.type === "trend_start" ? (
                  <SignalType trendStart />
                ) : (
                  t("test.allSignals")
                ),
              row,
            })),
          },
          {
            heading: t("test.band"),
            rows: model.test_by_score_band.map((row) => ({
              key: String(row.score_from),
              label: (
                <Badge size="sm" variant={scoreVariant(row.score_from)}>
                  {row.score_from}–{row.score_to}
                </Badge>
              ),
              row,
            })),
          },
        ].map(({ heading, rows }) => (
          <Table key={heading}>
            <Table.Header>
              <Table.Row>
                <Table.Head>{heading}</Table.Head>
                <Table.Head>{t("test.trades")}</Table.Head>
                <Table.Head>{t("test.winRate")}</Table.Head>
                <Table.Head>{t("test.meanReturn")}</Table.Head>
                <Table.Head>
                  {t("test.medianDays", { context: timeframe })}
                </Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map(({ key, label, row }) => (
                <OutcomeRow key={key} label={label} row={row} />
              ))}
            </Table.Body>
          </Table>
        ))}
        {model.test_by_index && (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>{t("test.index")}</Table.Head>
                <Table.Head>{t("test.trades")}</Table.Head>
                <Table.Head>{t("test.winRate")}</Table.Head>
                <Table.Head>{t("test.winRateScore70")}</Table.Head>
                <Table.Head>{t("test.meanReturn")}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {model.test_by_index.map((row) => (
                <Table.Row key={row.index}>
                  <Table.Cell>{t(`index.${row.index}`)}</Table.Cell>
                  <Table.Cell>{row.trades}</Table.Cell>
                  <Table.Cell>{rate(row.win_rate_pct)}</Table.Cell>
                  <Table.Cell>{rate(row.score_70_plus_win_rate_pct)}</Table.Cell>
                  <Table.Cell>
                    <Signed value={row.mean_return_pct} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
        <p className="mt-3 text-xs text-(--color-text-muted)">
          {model.rules}
        </p>
      </Card.Body>
    </Card>
  );
});

ModelTest.displayName = "ModelTest";

type TickerHistoryProps = { detail: TickerDetail; timeframe: Timeframe };

const TickerHistory = memo(({ detail, timeframe }: TickerHistoryProps) => {
  const { t } = useTranslation("signals");
  return (
    <Card>
      <Card.Header>
        <Card.Title>
          {detail.ticker} · {t("history.title")}
        </Card.Title>
        {detail.name && (
          <p className="text-sm text-(--color-text-muted)">{detail.name}</p>
        )}
      </Card.Header>
      <Card.Body className="overflow-x-auto">
        {detail.history.length === 0 ? (
          <p className="text-sm text-(--color-text-muted)">
            {t("history.empty")}
          </p>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>{t("columns.signal")}</Table.Head>
                <Table.Head>{t("columns.score")}</Table.Head>
                <Table.Head>
                  {t("columns.days", { context: timeframe })}
                </Table.Head>
                <Table.Head>{t("columns.result")}</Table.Head>
                <Table.Head>{t("columns.exit")}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {detail.history.map((trade) => (
                <Table.Row key={trade.signal_date}>
                  <Table.Cell className="whitespace-nowrap">
                    <div>{trade.signal_date}</div>
                    <SignalType trendStart={trade.trend_start} />
                  </Table.Cell>
                  <Table.Cell>
                    <Score value={trade.score} winRate={trade.win_rate_pct} />
                  </Table.Cell>
                  <Table.Cell>{trade.days}</Table.Cell>
                  <Table.Cell>
                    <Signed value={trade.return_pct} />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-(--color-text-muted)">
                    {trade.exit_reason
                      ? t(`exit.${trade.exit_reason}`)
                      : t("exit.open")}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card.Body>
    </Card>
  );
});

TickerHistory.displayName = "TickerHistory";

const Signals = memo(() => {
  const { t } = useTranslation("signals");
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickers, setTickers] = useState<TickerOption[]>([]);
  const [detail, setDetail] = useState<TickerDetail | null>(null);
  const [onlyTrendStarts, setOnlyTrendStarts] = useState(true);
  const [indexFilter, setIndexFilter] = useState<MarketIndex | "all">("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [signals, options] = await Promise.all([
        fetchSignals(timeframe),
        fetchTickers(timeframe),
      ]);
      setData(signals);
      setTickers(options);
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    void load();
    void fetchRefreshStatus()
      .then((status) => setRefreshing(status.running))
      .catch(() => undefined);
  }, [load]);

  useEffect(() => {
    if (!refreshing) return;
    const timer = window.setInterval(async () => {
      const status = await fetchRefreshStatus().catch(() => null);
      if (!status || status.running) return;
      setRefreshing(false);
      if (status.error) setError(status.error);
      else void load();
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refreshing, load]);

  const refresh = async (download: boolean) => {
    try {
      setRefreshing((await startRefresh(download)).running);
    } catch (refreshError) {
      setError((refreshError as Error).message);
    }
  };

  const openTicker = async (ticker: string, frame = timeframe) => {
    try {
      setDetail(await fetchTicker(ticker, frame));
      setError(null);
    } catch (detailError) {
      setDetail(null);
      setError((detailError as Error).message);
    }
  };

  const changeTimeframe = (next: Timeframe) => {
    if (next === timeframe) return;
    setTimeframe(next);
    if (detail) void openTicker(detail.ticker, next);
  };

  const indexes = useMemo(
    () =>
      INDEXES.filter((index) =>
        data?.signals.some((signal) => signal.index === index),
      ),
    [data],
  );
  const inIndex = useMemo(
    () =>
      (data?.signals ?? []).filter(
        (signal) => indexFilter === "all" || signal.index === indexFilter,
      ),
    [data, indexFilter],
  );
  const trendStarts = useMemo(
    () => inIndex.filter((signal) => signal.latest.trend_start),
    [inIndex],
  );
  const rows = onlyTrendStarts ? trendStarts : inIndex;

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-(--color-text-muted)">
              {data
                ? t("subtitle", { session: data.session, context: timeframe })
                : t("subtitleEmpty")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                  onClick={() => changeTimeframe(frame)}
                >
                  {t(`timeframe.${frame}`)}
                </Button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              isLoading={refreshing}
              leftIcon={<FiRefreshCw aria-hidden="true" />}
              onClick={() => void refresh(false)}
            >
              {t("refresh")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void refresh(true)}
            >
              {t("refreshWithDownload")}
            </Button>
          </div>
        </header>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading && !data ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !data ? (
          <EmptyState
            title={t("empty.title")}
            description={t("empty.description")}
            action={
              <Button size="sm" onClick={() => void refresh(false)}>
                {t("refresh")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="flex min-w-0 flex-col gap-6">
              <Card className="min-w-0">
                <Card.Header>
                  <Card.Title>{t("list.title")}</Card.Title>
                  <p className="text-sm text-(--color-text-muted)">
                    {t("list.description", { context: timeframe })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={onlyTrendStarts ? "primary" : "ghost"}
                      onClick={() => setOnlyTrendStarts(true)}
                    >
                      {t("list.trendStarts", { count: trendStarts.length })}
                    </Button>
                    <Button
                      size="sm"
                      variant={onlyTrendStarts ? "ghost" : "primary"}
                      onClick={() => setOnlyTrendStarts(false)}
                    >
                      {t("list.all", { count: inIndex.length })}
                    </Button>
                  </div>
                  {indexes.length > 1 && (
                    <div
                      role="group"
                      aria-label={t("index.label")}
                      className="flex flex-wrap gap-1"
                    >
                      {(["all", ...indexes] as const).map((index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant={indexFilter === index ? "secondary" : "ghost"}
                          aria-pressed={indexFilter === index}
                          onClick={() => setIndexFilter(index)}
                        >
                          {t(`index.${index}`)}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card.Header>
                <Card.Body className="overflow-x-auto">
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>{t("columns.ticker")}</Table.Head>
                        <Table.Head>{t("columns.signal")}</Table.Head>
                        <Table.Head>{t("columns.score")}</Table.Head>
                        <Table.Head>
                          {t("columns.days", { context: timeframe })}
                        </Table.Head>
                        <Table.Head>{t("columns.result")}</Table.Head>
                        <Table.Head>{t("columns.stop")}</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {rows.map((signal) => (
                        <Table.Row
                          key={signal.ticker}
                          className="cursor-pointer"
                          aria-selected={detail?.ticker === signal.ticker}
                          onClick={() => void openTicker(signal.ticker)}
                        >
                          <Table.Cell>
                            <div className="font-semibold">{signal.ticker}</div>
                            {signal.name && (
                              <div className="max-w-40 truncate text-xs text-(--color-text-muted)">
                                {signal.name}
                              </div>
                            )}
                            {signal.index && (
                              <div className="max-w-40 truncate text-xs text-(--color-text-muted)">
                                {[t(`index.${signal.index}`), signal.sector]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            )}
                          </Table.Cell>
                          <Table.Cell className="whitespace-nowrap">
                            <div>
                              {signal.signal_today ? (
                                <Badge size="sm" variant="info">
                                  {t("list.today")}
                                </Badge>
                              ) : (
                                signal.latest.signal_date
                              )}
                            </div>
                            <SignalType
                              trendStart={signal.latest.trend_start}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            <Score
                              value={signal.latest.score}
                              winRate={signal.latest.win_rate_pct}
                            />
                          </Table.Cell>
                          <Table.Cell>
                            {signal.position?.days ?? "—"}
                          </Table.Cell>
                          <Table.Cell>
                            {signal.position ? (
                              <Signed value={signal.position.return_pct} />
                            ) : (
                              "—"
                            )}
                          </Table.Cell>
                          <Table.Cell className="text-(--color-text-muted)">
                            {signal.position?.stop_price.toFixed(2) ?? "—"}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table>
                </Card.Body>
              </Card>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <TickerSearch
                options={tickers}
                onSelect={(ticker) => void openTicker(ticker)}
              />
              {detail ? (
                <TickerHistory detail={detail} timeframe={timeframe} />
              ) : (
                <EmptyState
                  title={t("history.selectTitle")}
                  description={t("history.selectDescription")}
                />
              )}
              <ModelTest model={data.model} timeframe={timeframe} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
});

Signals.displayName = "Signals";

export default Signals;
