import { useTranslation } from "react-i18next";

import type { RefreshProgress } from "../signalsApi";

/** Phase label plus a bar for the whole refresh job (download, then each timeframe). */
export const RefreshProgressBar = ({
  progress,
}: {
  progress: RefreshProgress;
}) => {
  const { t } = useTranslation("signals");
  const label =
    progress.phase === "download"
      ? progress.total
        ? t("progress.download", {
            done: progress.done.toLocaleString(),
            total: progress.total.toLocaleString(),
          })
        : t("progress.downloadStarting")
      : t("progress.predict", {
          timeframe: t(`timeframe.${progress.timeframe ?? "daily"}`),
          step: progress.done + 1,
          total: progress.total,
        });
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm text-(--color-text-muted)">
        <span>{label}</span>
        <span className="tabular-nums text-(--color-text)">
          {progress.percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="h-1.5 overflow-hidden rounded-full bg-(--color-surface)"
      >
        <div
          className="h-full rounded-full bg-(--color-primary) transition-[width] duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
};
