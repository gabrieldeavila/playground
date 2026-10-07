import { memo, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/ui/components/primitives/button";
import { Card } from "@/ui/components/primitives/card";
import { Table } from "@/ui/components/primitives/table";
import { SORT_KEYS, sortSignals, type Sort } from "../helpers/sort";
import type { MarketIndex, SignalSummary, Timeframe } from "../signalsApi";
import { SignalRow } from "./SignalRow";
import { SortableHead } from "./SortableHead";

const INDEXES: MarketIndex[] = [
  "sp500",
  "sp400",
  "sp600",
  "r2000",
  "nyse",
  "nasdaq",
  "watchlist",
  "other",
];

type SignalsListProps = {
  signals: SignalSummary[];
  timeframe: Timeframe;
  selectedTicker: string | null;
  onSelect: (ticker: string) => void;
};

/** Today's COMPRAs and open trades, filterable by type and index, sortable by column. */
export const SignalsList = memo(
  ({ signals, timeframe, selectedTicker, onSelect }: SignalsListProps) => {
    const { t } = useTranslation("signals");
    const [onlyTrendStarts, setOnlyTrendStarts] = useState(true);
    const [indexFilter, setIndexFilter] = useState<MarketIndex | "all">("all");
    const [sort, setSort] = useState<Sort | null>(null);

    const indexes = useMemo(
      () =>
        INDEXES.filter((index) =>
          signals.some((signal) => signal.index === index),
        ),
      [signals],
    );
    const inIndex = useMemo(
      () =>
        signals.filter(
          (signal) => indexFilter === "all" || signal.index === indexFilter,
        ),
      [signals, indexFilter],
    );
    const trendStarts = useMemo(
      () => inIndex.filter((signal) => signal.latest.trend_start),
      [inIndex],
    );
    const rows = useMemo(
      () => sortSignals(onlyTrendStarts ? trendStarts : inIndex, sort),
      [onlyTrendStarts, trendStarts, inIndex, sort],
    );

    return (
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
                {SORT_KEYS.map((column) => (
                  <SortableHead
                    key={column}
                    column={column}
                    sort={sort}
                    onSort={setSort}
                  >
                    {t(`columns.${column}`, { context: timeframe })}
                  </SortableHead>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((signal) => (
                <SignalRow
                  key={signal.ticker}
                  signal={signal}
                  timeframe={timeframe}
                  selected={selectedTicker === signal.ticker}
                  onSelect={onSelect}
                />
              ))}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>
    );
  },
);

SignalsList.displayName = "SignalsList";
