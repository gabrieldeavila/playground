import { describe, expect, it } from 'vitest';
import { workingLabel } from './working-label';

describe('workingLabel', () => {
  it('names the tool being written or run', () => {
    expect(workingLabel([{ kind: 'tool', name: 'batch', arguments: '', status: 'writing' }])).toBe('Writing batch…');
    expect(workingLabel([{ kind: 'tool', name: 'render_image', arguments: '{}', status: 'running' }])).toBe('Running render_image…');
  });

  it('says thinking while waiting on the model', () => {
    expect(workingLabel([{ kind: 'user', text: 'oi' }])).toBe('Thinking…');
    expect(workingLabel([{ kind: 'tool', name: 'x', arguments: '{}', status: 'done' }])).toBe('Thinking…');
  });
});
