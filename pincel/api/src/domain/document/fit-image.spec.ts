import { describe, expect, it } from 'vitest';
import { fitImage } from './fit-image.js';

const natural = { width: 200, height: 100 };
const canvas = { width: 100, height: 100 };

describe('fitImage', () => {
  it('uses the natural size by default', () => {
    expect(fitImage({ natural, canvas, x: 5, y: 6 })).toEqual({ x: 5, y: 6, width: 200, height: 100 });
  });

  it('keeps the aspect ratio when only one side is given', () => {
    expect(fitImage({ natural, canvas, width: 50 })).toEqual({ x: 0, y: 0, width: 50, height: 25 });
    expect(fitImage({ natural, canvas, height: 50 })).toEqual({ x: 0, y: 0, width: 100, height: 50 });
  });

  it('contains and covers the canvas, centered', () => {
    expect(fitImage({ natural, canvas, fit: 'contain' })).toEqual({ x: 0, y: 25, width: 100, height: 50 });
    expect(fitImage({ natural, canvas, fit: 'cover' })).toEqual({ x: -50, y: 0, width: 200, height: 100 });
  });
});
