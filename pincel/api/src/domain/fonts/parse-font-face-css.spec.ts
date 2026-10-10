import { describe, expect, it } from 'vitest';
import { parseFontFaceCss } from './parse-font-face-css.js';

const CSS = `
@font-face {
  font-family: 'Bebas Neue';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/bebasneue/a.ttf) format('truetype');
}
@font-face {
  font-family: "Montserrat";
  font-style: italic;
  font-weight: 900;
  src: url("https://fonts.gstatic.com/s/montserrat/b.ttf") format('truetype');
}`;

describe('parseFontFaceCss', () => {
  it('reads family, weight, style and file of each face', () => {
    expect(parseFontFaceCss(CSS)).toEqual([
      { family: 'Bebas Neue', weight: '400', style: 'normal', url: 'https://fonts.gstatic.com/s/bebasneue/a.ttf' },
      { family: 'Montserrat', weight: '900', style: 'italic', url: 'https://fonts.gstatic.com/s/montserrat/b.ttf' },
    ]);
  });

  it('skips blocks without a url', () => {
    expect(parseFontFaceCss('@font-face { font-family: X; }')).toEqual([]);
  });
});
