import { describe, expect, it } from 'vitest';
import { describeToolCall } from './describe-tool-call';

describe('describeToolCall', () => {
  it('lists the tools inside a batch, counting repeats', () => {
    const args = JSON.stringify({
      calls: [{ tool: 'add_layer' }, { tool: 'draw_text' }, { tool: 'draw_text' }, { tool: 'draw_text' }],
    });
    expect(describeToolCall('batch', args)).toBe('batch · add_layer, draw_text ×3');
  });

  it('keeps plain names for other tools and unfinished batches', () => {
    expect(describeToolCall('render_image', '{}')).toBe('render_image');
    expect(describeToolCall('batch', '')).toBe('batch');
  });
});
