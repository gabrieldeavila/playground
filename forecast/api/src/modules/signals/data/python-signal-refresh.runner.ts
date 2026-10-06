import { Injectable, Logger } from '@nestjs/common';
import {
  RefreshProgress,
  RefreshStatus,
  SignalRefreshRunner,
  TIMEFRAMES,
} from '../domain/signal-snapshot.js';
import { runPython } from './python-process.js';

/** Share of the bar the download takes; the predicts split the rest. */
const DOWNLOAD_WEIGHT = 85;
/** `forecast_ml.download` prints `[done/total] TICKER: ...` per ticker. */
const DOWNLOAD_LINE = /^\[(\d+)\/(\d+)\]/;

/** Runs the ML CLI (optional download, then a snapshot per timeframe), one job at a time. */
@Injectable()
export class PythonSignalRefreshRunner implements SignalRefreshRunner {
  private readonly logger = new Logger(PythonSignalRefreshRunner.name);
  private current: RefreshStatus = {
    running: false,
    startedAt: null,
    finishedAt: null,
    error: null,
    progress: null,
  };

  status(): RefreshStatus {
    return {
      ...this.current,
      progress: this.current.progress && { ...this.current.progress },
    };
  }

  start({ download }: { download: boolean }): RefreshStatus {
    if (this.current.running) return this.status();
    const downloadWeight = download ? DOWNLOAD_WEIGHT : 0;
    const predictWeight = (100 - downloadWeight) / TIMEFRAMES.length;
    const predictAt = (index: number): RefreshProgress => ({
      phase: 'predict',
      timeframe: TIMEFRAMES[index],
      done: index,
      total: TIMEFRAMES.length,
      percent: Math.round(downloadWeight + index * predictWeight),
    });
    this.current = {
      running: true,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
      progress: download
        ? { phase: 'download', timeframe: null, done: 0, total: 0, percent: 0 }
        : predictAt(0),
    };
    const steps: (() => Promise<unknown>)[] = [
      ...(download
        ? [
            () =>
              runPython(['-m', 'forecast_ml.download'], (line) => {
                const match = DOWNLOAD_LINE.exec(line);
                if (!match) return;
                const [done, total] = [Number(match[1]), Number(match[2])];
                this.current.progress = {
                  phase: 'download',
                  timeframe: null,
                  done,
                  total,
                  percent: Math.floor((done / total) * downloadWeight),
                };
              }),
          ]
        : []),
      ...TIMEFRAMES.map((timeframe, index) => () => {
        this.current.progress = predictAt(index);
        return runPython([
          '-m',
          'forecast_ml.modeling.kandle_model',
          'predict',
          '--timeframe',
          timeframe,
        ]);
      }),
    ];
    void steps
      .reduce(
        (previous, step) => previous.then(async () => void (await step())),
        Promise.resolve(),
      )
      .then(() => (this.current.error = null))
      .catch((error: Error) => {
        this.current.error = error.message;
        this.logger.error(error.message);
      })
      .finally(() => {
        this.current.running = false;
        this.current.progress = null;
        this.current.finishedAt = new Date().toISOString();
      });
    return this.status();
  }
}
