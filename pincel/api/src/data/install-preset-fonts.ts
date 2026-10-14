import { fontSpecOf, type PresetFont } from '../domain/presets/preset.js';
import { isFontInstalled, type FontStore } from './font-store.js';
import { installFont } from './install-font.js';

/** Makes a preset's fonts available, skipping the ones already installed. A font that fails is a warning, not an error. */
export async function installPresetFonts(fonts: FontStore, wanted: PresetFont[]): Promise<{ ready: string[]; warnings: string[] }> {
  const ready: string[] = [];
  const warnings: string[] = [];
  for (const spec of wanted.map(fontSpecOf)) {
    if (isFontInstalled(spec.family)) {
      ready.push(spec.family);
      continue;
    }
    try {
      ready.push((await installFont(fonts, spec)).family);
    } catch (error) {
      warnings.push(`could not load font "${spec.family}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { ready, warnings };
}
