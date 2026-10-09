import { describe, expect, it } from 'vitest';
import { fitWithin } from './fit-within.js';

describe('fitWithin', () => {
  it('keeps sizes that already fit', () => {
    expect(fitWithin(800, 600, 4096)).toEqual({ width: 800, height: 600 });
  });

  it('scales the longest side down, keeping the aspect ratio', () => {
    expect(fitWithin(6000, 4000, 3000)).toEqual({ width: 3000, height: 2000 });
    expect(fitWithin(3024, 4032, 2016)).toEqual({ width: 1512, height: 2016 });
  });
});
