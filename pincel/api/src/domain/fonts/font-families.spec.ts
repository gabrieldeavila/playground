import { describe, expect, it } from 'vitest';
import { familyNames, missingFamilies } from './font-families.js';

describe('familyNames', () => {
  it('splits and unquotes a family list', () => {
    expect(familyNames(`"Bebas Neue", 'Impact' ,sans-serif`)).toEqual(['Bebas Neue', 'Impact', 'sans-serif']);
  });
});

describe('missingFamilies', () => {
  it('lists families that are neither installed nor generic', () => {
    const installed = (name: string) => name === 'Impact';
    expect(missingFamilies('Bebas Neue, Impact, sans-serif', installed)).toEqual(['Bebas Neue']);
  });
});
