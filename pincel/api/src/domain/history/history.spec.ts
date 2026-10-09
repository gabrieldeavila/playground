import { describe, expect, it } from 'vitest';
import { appliedEntries, canRedo, canUndo, emptyHistory, pushEntry, redo, undo } from './history.js';

describe('history', () => {
  it('undoes and redoes entries', () => {
    let h = pushEntry(pushEntry(emptyHistory<string>(), 'a'), 'b');
    h = undo(h);
    expect(appliedEntries(h)).toEqual(['a']);
    expect(canRedo(h)).toBe(true);
    h = redo(h);
    expect(appliedEntries(h)).toEqual(['a', 'b']);
  });

  it('drops the redo branch when a new entry is pushed', () => {
    const h = pushEntry(undo(pushEntry(pushEntry(emptyHistory<string>(), 'a'), 'b')), 'c');
    expect(h.entries).toEqual(['a', 'c']);
    expect(canRedo(h)).toBe(false);
  });

  it('ignores undo/redo at the edges', () => {
    const h = emptyHistory<string>();
    expect(canUndo(h)).toBe(false);
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
  });
});
