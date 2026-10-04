import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import {
  RefreshStatus,
  SignalRefreshRunner,
  TIMEFRAMES,
} from '../domain/signal-snapshot.js';
import { mlDirectory } from './json-signal-snapshot.repository.js';

/** Runs the ML CLI (optional download, then a snapshot per timeframe), one job at a time. */
@Injectable()
export class PythonSignalRefreshRunner implements SignalRefreshRunner {
  private readonly logger = new Logger(PythonSignalRefreshRunner.name);
  private current: RefreshStatus = {
    running: false,
    startedAt: null,
    finishedAt: null,
    error: null,
  };

  status(): RefreshStatus {
    return { ...this.current };
  }

  start({ download }: { download: boolean }): RefreshStatus {
    if (this.current.running) return this.status();
    this.current = {
      running: true,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      error: null,
    };
    const steps = [
      ...(download ? [['-m', 'forecast_ml.download']] : []),
      ...TIMEFRAMES.map((timeframe) => [
        '-m',
        'forecast_ml.modeling.kandle_model',
        'predict',
        '--timeframe',
        timeframe,
      ]),
    ];
    void steps
      .reduce(
        (previous, step) => previous.then(() => run(step)),
        Promise.resolve(),
      )
      .then(() => (this.current.error = null))
      .catch((error: Error) => {
        this.current.error = error.message;
        this.logger.error(error.message);
      })
      .finally(() => {
        this.current.running = false;
        this.current.finishedAt = new Date().toISOString();
      });
    return this.status();
  }
}

function run(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('uv', ['run', 'python', ...args], {
      cwd: mlDirectory(),
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${args.join(' ')} falhou (${code}): ${stderr}`)),
    );
  });
}
