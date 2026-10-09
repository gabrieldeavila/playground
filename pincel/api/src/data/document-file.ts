import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { DocumentSetup } from '../domain/document/types.js';
import type { History } from '../domain/history/history.js';
import { normalizeLoggedCommand, type LoggedCommand } from './logged-command.js';

export interface SavedDocument {
  setup: DocumentSetup;
  history: History<LoggedCommand>;
}

/** Keeps the document across restarts as setup + command history (JSON). */
export function createDocumentFile(path: string) {
  return {
    async load(): Promise<SavedDocument | null> {
      try {
        const saved = JSON.parse(await readFile(path, 'utf8')) as SavedDocument;
        return { ...saved, history: { ...saved.history, entries: saved.history.entries.map(normalizeLoggedCommand) } };
      } catch {
        return null;
      }
    },
    async save(doc: SavedDocument): Promise<void> {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(doc));
    },
  };
}

export type DocumentFile = ReturnType<typeof createDocumentFile>;
