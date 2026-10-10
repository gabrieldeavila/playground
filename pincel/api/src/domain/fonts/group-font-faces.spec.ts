import { describe, expect, it } from 'vitest';
import { groupFontFaces } from './group-font-faces.js';

describe('groupFontFaces', () => {
  it('merges faces of a family and sorts their weights', () => {
    const faces = [
      { family: 'Montserrat', weight: '900' },
      { family: 'Bebas Neue', weight: '400' },
      { family: 'Montserrat', weight: '400' },
      { family: 'Montserrat', weight: '400' },
    ];
    expect(groupFontFaces(faces)).toEqual([
      { family: 'Montserrat', weights: ['400', '900'] },
      { family: 'Bebas Neue', weights: ['400'] },
    ]);
  });
});
