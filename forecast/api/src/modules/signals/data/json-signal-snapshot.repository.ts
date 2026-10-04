import { Injectable } from '@nestjs/common';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  SignalSnapshot,
  SignalSnapshotRepository,
  Timeframe,
} from '../domain/signal-snapshot.js';

export const mlDirectory = () => resolve(process.env.ML_DIR ?? '../ml');

/** Daily keeps the original file name; other timeframes get a suffix. */
const snapshotFile = (timeframe: Timeframe) =>
  timeframe === 'daily'
    ? 'kandle_signals.json'
    : `kandle_signals_${timeframe}.json`;

@Injectable()
export class JsonSignalSnapshotRepository implements SignalSnapshotRepository {
  private readonly directory = resolve(
    process.env.SIGNALS_SNAPSHOT_DIR ?? `${mlDirectory()}/data/processed`,
  );
  private readonly cache = new Map<
    Timeframe,
    { mtimeMs: number; snapshot: SignalSnapshot }
  >();

  async read(timeframe: Timeframe): Promise<SignalSnapshot | null> {
    const filePath = resolve(this.directory, snapshotFile(timeframe));
    let mtimeMs: number;
    try {
      ({ mtimeMs } = await stat(filePath));
    } catch {
      return null;
    }
    // The ML job replaces the file atomically; reparse only when it changed.
    let cached = this.cache.get(timeframe);
    if (cached?.mtimeMs !== mtimeMs) {
      const snapshot = JSON.parse(
        await readFile(filePath, 'utf8'),
      ) as SignalSnapshot;
      cached = { mtimeMs, snapshot };
      this.cache.set(timeframe, cached);
    }
    return cached.snapshot;
  }
}
