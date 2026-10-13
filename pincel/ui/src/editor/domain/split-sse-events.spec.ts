import { describe, expect, it } from 'vitest';
import { splitSseEvents } from './split-sse-events';

describe('splitSseEvents', () => {
  it('parses complete events and keeps the unfinished tail', () => {
    expect(splitSseEvents('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"')).toEqual({
      events: [{ a: 1 }, { b: 2 }],
      rest: 'data: {"c"',
    });
  });

  it('skips comments and empty blocks', () => {
    expect(splitSseEvents(': ping\n\ndata: {"a":1}\n\n')).toEqual({ events: [{ a: 1 }], rest: '' });
  });
});
