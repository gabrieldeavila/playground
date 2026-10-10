import { describe, expect, it } from 'vitest';
import { wrapText } from './wrap-text.js';

// Every character is 10px wide.
const measure = (line: string) => line.length * 10;

describe('wrapText', () => {
  it('breaks between words to stay inside the width', () => {
    expect(wrapText('summer music festival', 120, measure)).toEqual(['summer music', 'festival']);
  });

  it('keeps explicit line breaks', () => {
    expect(wrapText('a b\nc', 1000, measure)).toEqual(['a b', 'c']);
  });

  it('puts a word that is too wide on its own line', () => {
    expect(wrapText('hi extraordinary yo', 50, measure)).toEqual(['hi', 'extraordinary', 'yo']);
  });

  it('keeps repeated spaces inside a line', () => {
    expect(wrapText('NEON   DRIVE', 1000, measure)).toEqual(['NEON   DRIVE']);
  });

  it('drops the spaces where a line breaks', () => {
    expect(wrapText('aaaa   bbbb', 60, measure)).toEqual(['aaaa', 'bbbb']);
  });

  it('keeps empty lines', () => {
    expect(wrapText('a\n\nb', 100, measure)).toEqual(['a', '', 'b']);
  });
});
