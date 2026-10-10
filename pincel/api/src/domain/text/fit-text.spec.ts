import { describe, expect, it } from 'vitest';
import { fitText, wrapAt } from './fit-text.js';

// Each character is as wide as half the font size.
const measure = (line: string, size: number) => line.length * size * 0.5;

describe('fitText', () => {
  it('picks the biggest size where the longest line fits the width', () => {
    const fitted = fitText({ text: 'SALE', width: 200, maxSize: 500, minSize: 8, lineHeight: 1 }, measure);
    expect(fitted).toEqual({ lines: ['SALE'], size: 100, overflows: false });
  });

  it('wraps onto more lines when there is height for them', () => {
    const fitted = fitText({ text: 'BIG SALE', width: 200, height: 400, maxSize: 500, minSize: 8, lineHeight: 1 }, measure);
    expect(fitted.lines).toEqual(['BIG', 'SALE']);
    expect(fitted.size).toBe(100);
  });

  it('never goes above maxSize', () => {
    expect(fitText({ text: 'A', width: 1000, maxSize: 60, minSize: 8, lineHeight: 1 }, measure).size).toBe(60);
  });

  it('reports overflow when even minSize does not fit', () => {
    const fitted = fitText({ text: 'TOO LONG', width: 10, height: 10, maxSize: 60, minSize: 20, lineHeight: 1 }, measure);
    expect(fitted).toMatchObject({ size: 20, overflows: true });
  });
});

describe('wrapAt', () => {
  it('flags text taller than the box', () => {
    const fitted = wrapAt({ text: 'a\nb\nc', width: 100, height: 50, maxSize: 20, minSize: 8, lineHeight: 1.2 }, 20, measure);
    expect(fitted.overflows).toBe(true);
  });
});
