/** Width of one line of text in pixels. */
export type MeasureLine = (line: string) => number;

/**
 * Breaks text into lines no wider than maxWidth, keeping explicit \n breaks.
 * A word wider than maxWidth gets a line of its own instead of being split.
 */
export function wrapText(text: string, maxWidth: number, measure: MeasureLine): string[] {
  return text.split('\n').flatMap((paragraph) => wrapParagraph(paragraph, maxWidth, measure));
}

function wrapParagraph(paragraph: string, maxWidth: number, measure: MeasureLine): string[] {
  // Spaces between words are kept as typed; only the space where a line breaks is dropped.
  const tokens = paragraph.match(/\S+|\s+/g) ?? [];
  const lines: string[] = [];
  let current = '';
  let gap = '';
  for (const token of tokens) {
    if (/^\s/.test(token)) {
      gap = token;
      continue;
    }
    const candidate = current ? current + gap + token : token;
    if (!current || measure(candidate) <= maxWidth) current = candidate;
    else {
      lines.push(current);
      current = token;
    }
    gap = '';
  }
  lines.push(current);
  return lines;
}
