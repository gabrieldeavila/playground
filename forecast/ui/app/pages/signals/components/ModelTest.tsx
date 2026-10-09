import { memo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/ui/components/primitives/badge";
import { Card } from "@/ui/components/primitives/card";
import { Table } from "@/ui/components/primitives/table";
import { Signed, rate, scoreVariant } from "../shared";
import { SignalTypeBadge } from "./SignalTypeBadge";
import type { ModelSummary, Timeframe } from "../signalsApi";

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

type ModelTestProps = { model: ModelSummary; timeframe: Timeframe };

export const ModelTest = memo(({ model, timeframe }: ModelTestProps) => {
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
                row.type === "all" ? (
                  t("test.allSignals")
                ) : (
                  <SignalTypeBadge type={row.type} />
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
