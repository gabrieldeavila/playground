import { useEffect, useState } from "react";

import {
  fetchRefreshStatus,
  startRefresh,
  type RefreshProgress,
} from "../signalsApi";

type Options = {
  /** Called once the job finishes without error. */
  onDone: () => void;
  onError: (message: string) => void;
};

/** Starts the refresh job and polls its progress until it finishes. */
export const useRefresh = ({ onDone, onError }: Options) => {
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState<RefreshProgress | null>(null);

  // Picks up a job already running, e.g. after a page reload.
  useEffect(() => {
    void fetchRefreshStatus()
      .then((status) => {
        setRefreshing(status.running);
        setProgress(status.progress);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!refreshing) return;
    const timer = window.setInterval(async () => {
      const status = await fetchRefreshStatus().catch(() => null);
      if (!status) return;
      setProgress(status.progress);
      if (status.running) return;
      setRefreshing(false);
      if (status.error) onError(status.error);
      else onDone();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [refreshing, onDone, onError]);

  const refresh = async (download: boolean) => {
    try {
      const status = await startRefresh(download);
      setRefreshing(status.running);
      setProgress(status.progress);
    } catch (refreshError) {
      onError((refreshError as Error).message);
    }
  };

  return { refreshing, progress, refresh };
};
