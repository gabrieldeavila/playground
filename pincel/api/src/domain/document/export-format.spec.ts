import { describe, expect, it } from 'vitest';
import { exportFormatOf } from './export-format.js';

describe('exportFormatOf', () => {
  it('reads the format from the extension, in any case', () => {
    expect(exportFormatOf('~/out/post.png')).toBe('png');
    expect(exportFormatOf('/tmp/a.JPG')).toBe('jpeg');
    expect(exportFormatOf('b.jpeg')).toBe('jpeg');
    expect(exportFormatOf('c.webp')).toBe('webp');
  });

  it('refuses anything that is not an image file', () => {
    expect(() => exportFormatOf('~/.zshrc')).toThrow('must end in .png');
    expect(() => exportFormatOf('notes.txt')).toThrow('must end in .png');
  });
});
