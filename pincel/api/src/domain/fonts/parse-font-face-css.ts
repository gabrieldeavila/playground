export interface FontFace {
  family: string;
  weight: string;
  style: string;
  url: string;
}

/** Reads the @font-face blocks of a stylesheet (e.g. from fonts.googleapis.com). */
export function parseFontFaceCss(css: string): FontFace[] {
  const blocks = css.match(/@font-face\s*{[^}]*}/g) ?? [];
  return blocks.flatMap((block) => {
    const family = property(block, 'font-family')?.replace(/^['"]|['"]$/g, '');
    const url = block.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1];
    if (!family || !url) return [];
    return [{ family, url, weight: property(block, 'font-weight') ?? '400', style: property(block, 'font-style') ?? 'normal' }];
  });
}

function property(block: string, name: string): string | undefined {
  return block.match(new RegExp(`${name}\\s*:\\s*([^;]+);`))?.[1].trim();
}
