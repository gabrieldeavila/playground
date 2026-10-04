import { Injectable } from '@nestjs/common';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  SignalSnapshot,
  SignalSnapshotRepository,
} from '../domain/signal-snapshot.js';

export const mlDirectory = () => resolve(process.env.ML_DIR ?? '../ml');

@Injectable()
export class JsonSignalSnapshotRepository implements SignalSnapshotRepository {
  private readonly filePath = resolve(
    process.env.SIGNALS_SNAPSHOT_PATH ??
      `${mlDirectory()}/data/processed/kandle_signals.json`,
  );
  private cache: { mtimeMs: number; snapshot: SignalSnapshot } | null = null;

  async read(): Promise<SignalSnapshot | null> {
    let mtimeMs: number;
    try {
      ({ mtimeMs } = await stat(this.filePath));
    } catch {
      return null;
    }
    // The ML job replaces the file atomically; reparse only when it changed.
    if (this.cache?.mtimeMs !== mtimeMs) {
      const snapshot = JSON.parse(
        await readFile(this.filePath, 'utf8'),
      ) as SignalSnapshot;
      this.cache = { mtimeMs, snapshot };
    }
    return this.cache.snapshot;
  }
}
