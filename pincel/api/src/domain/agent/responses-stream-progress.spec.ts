import { describe, expect, it } from 'vitest';
import { responsesStreamProgress } from './responses-stream-progress.js';

describe('responsesStreamProgress', () => {
  it('passes reasoning summaries and answer text through as deltas', () => {
    expect(responsesStreamProgress({ type: 'response.reasoning_summary_text.delta', delta: 'Planning' })).toEqual({
      type: 'reasoning-delta',
      text: 'Planning',
    });
    expect(responsesStreamProgress({ type: 'response.output_text.delta', delta: 'Vou' })).toEqual({ type: 'text-delta', text: 'Vou' });
  });

  it('announces a tool as soon as the model starts writing its call', () => {
    expect(
      responsesStreamProgress({ type: 'response.output_item.added', item: { type: 'function_call', name: 'batch' } }),
    ).toEqual({ type: 'tool-writing', name: 'batch' });
  });

  it('ignores everything else', () => {
    expect(responsesStreamProgress({ type: 'response.output_item.added', item: { type: 'reasoning' } })).toBeUndefined();
    expect(responsesStreamProgress({ type: 'response.function_call_arguments.delta', delta: '{' })).toBeUndefined();
  });
});
