import { Injectable } from '@nestjs/common';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Timeframe } from '../domain/signal-snapshot.js';
import type { TickerChart, TickerChartReader } from '../domain/ticker-chart.js';
import { mlDirectory } from './json-signal-snapshot.repository.js';
import { PythonProcessError, runPython } from './python-process.js';

/** Exit code of forecast_ml.chart for a ticker without candles. */
const NOT_FOUND = 3;
const CACHE_SIZE = 50;

const tradesFile = (timeframe: Timeframe) =>
  resolve(
    mlDirectory(),
    'data/processed',
    timeframe === 'daily'
      ? 'kandle_trades.parquet'
      : `kandle_trades_${timeframe}.parquet`,
  );

/** Runs forecast_ml.chart per ticker; results stay cached until predict rewrites the trades. */
@Injectable()
export class PythonTickerChartReader implements TickerChartReader {
  private readonly cache = new Map<
    string,
    { mtimeMs: number; chart: TickerChart }
  >();

  async read(ticker: string, timeframe: Timeframe) {
    const mtimeMs = await stat(tradesFile(timeframe)).then(
      (file) => file.mtimeMs,
      () => 0,
    );
    const key = `${timeframe}:${ticker}`;
    const cached = this.cache.get(key);
    if (cached?.mtimeMs === mtimeMs) return cached.chart;

    let output: string;
    try {
      output = await runPython([
        '-m',
        'forecast_ml.chart',
        ticker,
        '--timeframe',
        timeframe,
      ]);
    } catch (error) {
      if (error instanceof PythonProcessError && error.code === NOT_FOUND)
        return null;
      throw error;
    }
    const chart = JSON.parse(output) as TickerChart;
    this.cache.delete(key);
    this.cache.set(key, { mtimeMs, chart });
    // Map keeps insertion order: drop the oldest entry.
    if (this.cache.size > CACHE_SIZE)
      this.cache.delete(this.cache.keys().next().value as string);
    return chart;
  }
}
