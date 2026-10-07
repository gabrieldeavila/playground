import { memo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert } from "@/ui/components/primitives/alert";
import { Button } from "@/ui/components/primitives/button";
import { EmptyState } from "@/ui/components/primitives/empty-state";
import { Spinner } from "@/ui/components/primitives/spinner";
import { ModelTest } from "./components/ModelTest";
import { RefreshProgressBar } from "./components/RefreshProgressBar";
import { SignalsHeader } from "./components/SignalsHeader";
import { SignalsList } from "./components/SignalsList";
import { TickerHistory } from "./components/TickerHistory";
import { TickerSearch } from "./components/TickerSearch";
import { lastClosedSession } from "./helpers/session";
import { useRefresh } from "./hooks/useRefresh";
import { useSignals } from "./hooks/useSignals";
import { useTickerDetail } from "./hooks/useTickerDetail";
import type { Timeframe } from "./signalsApi";

export function meta() {
  return [{ title: "Sinais Kandle + IA" }];
}

const Signals = memo(() => {
  const { t } = useTranslation("signals");
  const [timeframe, setTimeframe] = useState<Timeframe>("daily");
  const { data, tickers, loading, error, setError, reload } =
    useSignals(timeframe);
  const { refreshing, progress, refresh } = useRefresh({
    onDone: reload,
    onError: setError,
  });
  const { detail, select } = useTickerDetail(timeframe, setError);
  const stale = data && !refreshing && data.session < lastClosedSession();

  return (
    <main className="min-h-[100dvh] bg-(--color-bg) text-(--color-text)">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10">
        <SignalsHeader
          session={data?.session ?? null}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          refreshing={refreshing}
          progress={progress}
          onRefresh={(download) => void refresh(download)}
        />

        {refreshing && progress && <RefreshProgressBar progress={progress} />}

        {error && <Alert variant="danger">{error}</Alert>}
        {stale && (
          <Alert variant="warning">
            {t("stale", { session: data.session, expected: lastClosedSession() })}
          </Alert>
        )}

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
              <SignalsList
                signals={data.signals}
                timeframe={timeframe}
                selectedTicker={detail?.ticker ?? null}
                onSelect={select}
              />
            </div>

            <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-4 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-2rem)] lg:self-start">
              <TickerSearch options={tickers} onSelect={select} />
              {detail ? (
                <TickerHistory detail={detail} timeframe={timeframe} />
              ) : (
                <EmptyState
                  title={t("history.selectTitle")}
                  description={t("history.selectDescription")}
                />
              )}
            </div>

            <div className="min-w-0 lg:col-start-1">
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
