import { memo, useCallback, useEffect, useState } from "react";
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
  type ModelSummary,
  type SignalsResponse,
  type TickerDetail,
  type TickerOption,
} from "./signalsApi";
import { TickerSearch } from "./TickerSearch";

const percent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

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

const Score = ({ value }: { value: number }) => (
  <Badge size="sm" variant={scoreVariant(value)}>
    {value}
  </Badge>
);

export function meta() {
  return [{ title: "Sinais Kandle + IA" }];
}

const ModelTest = memo(({ model }: { model: ModelSummary }) => {
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
      <Card.Body className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>{t("test.minScore")}</Table.Head>
              <Table.Head>{t("test.trades")}</Table.Head>
              <Table.Head>{t("test.winRate")}</Table.Head>
              <Table.Head>{t("test.meanReturn")}</Table.Head>
              <Table.Head>{t("test.medianDays")}</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {model.test_by_min_score.map((row) => (
              <Table.Row key={row.min_score}>
                <Table.Cell>
                  {row.min_score === 0 ? t("test.all") : `≥ ${row.min_score}`}
                </Table.Cell>
                <Table.Cell>{row.trades}</Table.Cell>
                <Table.Cell>{row.win_rate_pct.toFixed(1)}%</Table.Cell>
                <Table.Cell>
                  <Signed value={row.mean_return_pct} />
                </Table.Cell>
                <Table.Cell>{row.median_days}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
        <p className="mt-3 text-xs text-(--color-text-muted)">
          {model.rules}
        </p>
      </Card.Body>
    </Card>
  );
});

ModelTest.displayName = "ModelTest";

const TickerHistory = memo(({ detail }: { detail: TickerDetail }) => {
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
                <Table.Head>{t("columns.days")}</Table.Head>
                <Table.Head>{t("columns.result")}</Table.Head>
                <Table.Head>{t("columns.exit")}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {detail.history.map((trade) => (
                <Table.Row key={trade.signal_date}>
                  <Table.Cell className="whitespace-nowrap">
                    {trade.signal_date}
                  </Table.Cell>
                  <Table.Cell>
                    <Score value={trade.score} />
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [signals, options] = await Promise.all([
        fetchSignals(),
        fetchTickers(),
      ]);
      setData(signals);
      setTickers(options);
      setError(null);
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const openTicker = async (ticker: string) => {
    try {
      setDetail(await fetchTicker(ticker));
      setError(null);
    } catch (detailError) {
      setError((detailError as Error).message);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-(--color-text-muted)">
              {data ? t("subtitle", { session: data.session }) : t("subtitleEmpty")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
                    {t("list.description")}
                  </p>
                </Card.Header>
                <Card.Body className="overflow-x-auto">
                  <Table>
                    <Table.Header>
                      <Table.Row>
                        <Table.Head>{t("columns.ticker")}</Table.Head>
                        <Table.Head>{t("columns.signal")}</Table.Head>
                        <Table.Head>{t("columns.score")}</Table.Head>
                        <Table.Head>{t("columns.days")}</Table.Head>
                        <Table.Head>{t("columns.result")}</Table.Head>
                        <Table.Head>{t("columns.stop")}</Table.Head>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {data.signals.map((signal) => (
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
                          </Table.Cell>
                          <Table.Cell className="whitespace-nowrap">
                            {signal.signal_today ? (
                              <Badge size="sm" variant="info">
                                {t("list.today")}
                              </Badge>
                            ) : (
                              signal.latest.signal_date
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <Score value={signal.latest.score} />
                          </Table.Cell>
                          <Table.Cell>{signal.position?.days ?? "—"}</Table.Cell>
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
                <TickerHistory detail={detail} />
              ) : (
                <EmptyState
                  title={t("history.selectTitle")}
                  description={t("history.selectDescription")}
                />
              )}
              <ModelTest model={data.model} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
});

Signals.displayName = "Signals";

export default Signals;
