import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiBarChart2 } from "react-icons/fi";
import { Link } from "react-router";

import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Table } from "@/ui/components/primitives/table";
import { Score, Signed, SignalType } from "../shared";
import type { TickerDetail, Timeframe } from "../signalsApi";

type TickerHistoryProps = { detail: TickerDetail; timeframe: Timeframe };

export const TickerHistory = memo(({ detail, timeframe }: TickerHistoryProps) => {
  const { t } = useTranslation("signals");
  return (
    <Card className="lg:flex lg:min-h-0 lg:flex-col">
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Card.Title>
              {detail.ticker} · {t("history.title")}
            </Card.Title>
            {detail.name && (
              <p className="text-sm text-(--color-text-muted)">
                {detail.name}
              </p>
            )}
          </div>
          <Button
            asChild
            size="sm"
            variant="secondary"
            leftIcon={<FiBarChart2 aria-hidden="true" />}
          >
            <Link
              to={`/signals/${encodeURIComponent(detail.ticker)}?timeframe=${timeframe}`}
            >
              {t("history.openChart")}
            </Link>
          </Button>
        </div>
      </Card.Header>
      <Card.Body className="overflow-x-auto lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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
                  <Table.Cell>{trade.days ?? "—"}</Table.Cell>
                  <Table.Cell>
                    {trade.return_pct == null ? (
                      "—"
                    ) : (
                      <Signed value={trade.return_pct} />
                    )}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-(--color-text-muted)">
                    {trade.pending
                      ? t("list.buyNextOpen", { context: timeframe })
                      : trade.exit_reason
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
