import { isFontInstalled } from '../../data/font-store.js';
import { measurerFor, measureText } from '../../data/measure-text.js';
import { missingFamilies } from '../../domain/fonts/font-families.js';
import { textBox, type TextAlign } from '../../domain/paint/text-layout.js';
import { layoutText, type TextLayoutRequest } from '../../domain/text/layout-text.js';

export interface TextInput extends TextLayoutRequest {
  font: string;
  weight: string;
  letterSpacing: number;
  align: TextAlign;
}

/** Lays out text the way draw_text will draw it, plus notes worth telling the caller. */
export function resolveText(input: TextInput) {
  const style = { font: input.font, weight: input.weight, letterSpacing: input.letterSpacing, lineHeight: input.lineHeight };
  const layout = layoutText(input, measurerFor(style));
  const text = layout.lines.join('\n');
  const metrics = measureText(text, { ...style, size: layout.size });
  const box = textBox(layout.position, input.align, metrics.width, layout.lines.length, layout.size, input.lineHeight);
  return { text, size: layout.size, position: layout.position, metrics, box, notes: textNotes(input.font, layout.overflows) };
}

function textNotes(font: string, overflows: boolean): string[] {
  const notes = missingFamilies(font, isFontInstalled).map(
    (family) => `Font "${family}" is not installed, so a fallback font was used. load_font it first.`,
  );
  if (overflows) notes.push('The text does not fit its box; shorten it, enlarge the box or lower minSize.');
  return notes;
}
