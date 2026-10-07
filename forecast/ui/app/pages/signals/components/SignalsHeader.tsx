import { useTranslation } from "react-i18next";
import { FiRefreshCw } from "react-icons/fi";

import { Button } from "@/ui/components/primitives/button";
import type { RefreshProgress, Timeframe } from "../signalsApi";

const TIMEFRAMES: Timeframe[] = ["daily", "weekly"];

type SignalsHeaderProps = {
  session: string | null;
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
  refreshing: boolean;
  progress: RefreshProgress | null;
  onRefresh: (download: boolean) => void;
};

/** Title, timeframe toggle and the two refresh buttons. */
export const SignalsHeader = ({
  session,
  timeframe,
  onTimeframeChange,
  refreshing,
  progress,
  onRefresh,
}: SignalsHeaderProps) => {
  const { t } = useTranslation("signals");
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-(--color-text-muted)">
          {session
            ? t("subtitle", { session, context: timeframe })
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
              onClick={() => onTimeframeChange(frame)}
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
          onClick={() => onRefresh(false)}
        >
          {t("refresh")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={() => onRefresh(true)}
        >
          {refreshing && progress
            ? t("progress.button", { percent: progress.percent })
            : t("refreshWithDownload")}
        </Button>
      </div>
    </header>
  );
};
