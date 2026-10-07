import { memo } from "react";
import { useTranslation } from "react-i18next";
import { FiBarChart2 } from "react-icons/fi";
import { Link } from "react-router";

import { Badge } from "@/ui/components/primitives/badge";
import { Table } from "@/ui/components/primitives/table";
import { Score, Signed, SignalType } from "../shared";
import type { SignalSummary, Timeframe } from "../signalsApi";

type SignalRowProps = {
  signal: SignalSummary;
  timeframe: Timeframe;
  selected: boolean;
  onSelect: (ticker: string) => void;
};

export const SignalRow = memo(
  ({ signal, timeframe, selected, onSelect }: SignalRowProps) => {
    const { t } = useTranslation("signals");
    return (
      <Table.Row
        className="cursor-pointer"
        aria-selected={selected}
        onClick={() => onSelect(signal.ticker)}
      >
        <Table.Cell>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{signal.ticker}</span>
            <Link
              to={`/signals/${encodeURIComponent(signal.ticker)}?timeframe=${timeframe}`}
              title={t("history.openChart")}
              aria-label={`${t("history.openChart")} ${signal.ticker}`}
              className="rounded-(--radius-xs) p-1 text-(--color-text-muted) hover:bg-(--color-surface-3) hover:text-(--color-primary)"
              onClick={(event) => event.stopPropagation()}
            >
              <FiBarChart2 aria-hidden="true" />
            </Link>
          </div>
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
          <div>{signal.latest.signal_date}</div>
          <div className="mt-1 flex flex-col items-start gap-1">
            {signal.signal_today && (
              <Badge size="sm" variant="info">
                {t("list.buyNextOpen", { context: timeframe })}
              </Badge>
            )}
            <SignalType trendStart={signal.latest.trend_start} />
          </div>
        </Table.Cell>
        <Table.Cell>
          <Score
            value={signal.latest.score}
            winRate={signal.latest.win_rate_pct}
          />
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
    );
  },
);

SignalRow.displayName = "SignalRow";
