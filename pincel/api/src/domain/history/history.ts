/** Linear undo history: entries before the cursor are applied, entries after it can be redone. */
export interface History<T> {
  entries: T[];
  cursor: number;
}

export function emptyHistory<T>(): History<T> {
  return { entries: [], cursor: 0 };
}

export function pushEntry<T>(history: History<T>, entry: T): History<T> {
  const entries = [...history.entries.slice(0, history.cursor), entry];
  return { entries, cursor: entries.length };
}

export function canUndo(history: History<unknown>): boolean {
  return history.cursor > 0;
}

export function canRedo(history: History<unknown>): boolean {
  return history.cursor < history.entries.length;
}

export function undo<T>(history: History<T>): History<T> {
  return canUndo(history) ? { ...history, cursor: history.cursor - 1 } : history;
}

export function redo<T>(history: History<T>): History<T> {
  return canRedo(history) ? { ...history, cursor: history.cursor + 1 } : history;
}

export function appliedEntries<T>(history: History<T>): T[] {
  return history.entries.slice(0, history.cursor);
}
