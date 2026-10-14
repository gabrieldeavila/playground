import type { Preset } from './preset.js';

export interface AppliedPreset {
  preset: Preset;
  /** What happened to the document: a template was loaded, a blank canvas was made, or it was left alone. */
  document: 'template' | 'canvas' | 'unchanged';
  width: number;
  height: number;
  fonts: string[];
  warnings: string[];
}

/** What the model needs to know after a preset is applied, as plain text. */
export function presetBrief(applied: AppliedPreset): string {
  const { preset } = applied;
  const facts = [
    `Preset "${preset.name}" applied: ${preset.description}`,
    documentLine(applied),
    applied.fonts.length ? `Fonts ready: ${applied.fonts.map((f) => `"${f}"`).join(', ')}` : '',
    listLine('Colors', preset.colors),
    listLine('Assets (bring in with place_image path, or open_image when it is the base photo)', preset.assets),
    ...applied.warnings.map((warning) => `Warning: ${warning}`),
  ];
  return [...facts.filter(Boolean), '', 'Instructions:', preset.instructions].join('\n');
}

function documentLine({ document, width, height }: AppliedPreset): string {
  if (document === 'template') return `The document is now the preset's template (${width}x${height}); call get_document to see its layers.`;
  if (document === 'canvas') return `New ${width}x${height} document.`;
  return `The document was left as it was (${width}x${height}).`;
}

function listLine(label: string, entries: Record<string, string>): string {
  const pairs = Object.entries(entries);
  return pairs.length ? `${label}: ${pairs.map(([key, value]) => `${key} = ${value}`).join(', ')}` : '';
}
