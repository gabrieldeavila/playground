/** Mirrors GET /api/presets. */
export interface PresetSummary {
  name: string;
  description: string;
  hasTemplate: boolean;
  hasPreview: boolean;
}

/** A Google Fonts family by name, or a font file with the family name it gets. */
export type PresetFont = string | { family: string; source?: string; weights?: string[] };

/** Mirrors GET /api/presets/:name. */
export interface PresetDetails extends PresetSummary {
  instructions: string;
  canvas?: { width: number; height: number; background: string };
  fonts: PresetFont[];
  colors: Record<string, string>;
  assets: Record<string, string>;
}

/** The chosen preset, or none when it was deleted since it was picked. */
export function keepChosenPreset(chosen: string, presets: PresetSummary[]): string {
  return presets.some((preset) => preset.name === chosen) ? chosen : '';
}

export function fontFamilyOf(font: PresetFont): string {
  return typeof font === 'string' ? font : font.family;
}

/** Stylesheet that lets the browser show the preset's Google Fonts; font files can't be loaded this way. */
export function googleFontsHref(fonts: PresetFont[]): string | null {
  const families = fonts.filter((font) => typeof font === 'string' || !font.source).map(fontFamilyOf);
  if (families.length === 0) return null;
  const query = families.map((family) => `family=${encodeURIComponent(family).replace(/%20/g, '+')}`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
