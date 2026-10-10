import { describe, expect, it } from 'vitest';
import { layoutText, type TextLayoutRequest } from './layout-text.js';

const measure = (line: string, size: number) => line.length * size * 0.5;
const base: TextLayoutRequest = {
  text: 'SALE',
  size: 40,
  lineHeight: 1,
  align: 'left',
  fit: 'none',
  minSize: 8,
  verticalAlign: 'top',
};

describe('layoutText', () => {
  it('keeps free text at its position and line breaks', () => {
    expect(layoutText({ ...base, text: 'a\nb', position: [5, 6] }, measure)).toEqual({
      lines: ['a', 'b'],
      size: 40,
      position: [5, 6],
      overflows: false,
    });
  });

  it('needs a position or a box', () => {
    expect(() => layoutText(base, measure)).toThrow(/position or box/);
  });

  it('anchors to the box edge or center depending on align', () => {
    const box = { x: 100, y: 50, width: 200 };
    expect(layoutText({ ...base, box, align: 'center' }, measure).position).toEqual([200, 50]);
    expect(layoutText({ ...base, box, align: 'right' }, measure).position).toEqual([300, 50]);
  });

  it('centers the text block vertically in the box', () => {
    const layout = layoutText({ ...base, box: { x: 0, y: 0, width: 400, height: 200 }, verticalAlign: 'middle' }, measure);
    expect(layout.position).toEqual([0, 80]);
  });

  it('shrinks the text to fit when asked', () => {
    const layout = layoutText({ ...base, size: 300, fit: 'shrink', box: { x: 0, y: 0, width: 200, height: 300 } }, measure);
    expect(layout.size).toBe(100);
  });
});
