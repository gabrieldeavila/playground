import { describe, expect, it } from 'vitest';
import { textBox, textLines } from './text-layout.js';

describe('textBox', () => {
  it('anchors the box according to alignment', () => {
    expect(textBox([100, 10], 'left', 40, 1, 20).x).toBe(100);
    expect(textBox([100, 10], 'center', 40, 1, 20).x).toBe(80);
    expect(textBox([100, 10], 'right', 40, 1, 20).x).toBe(60);
  });

  it('grows with the number of lines', () => {
    expect(textBox([0, 0], 'left', 10, 3, 20).height).toBe(72);
    expect(textLines('a\nb\nc')).toHaveLength(3);
  });
});
