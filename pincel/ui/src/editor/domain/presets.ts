/** Mirrors GET /api/presets. */
export interface PresetSummary {
  name: string;
  description: string;
  hasTemplate: boolean;
}

/** The chosen preset, or none when it was deleted since it was picked. */
export function keepChosenPreset(chosen: string, presets: PresetSummary[]): string {
  return presets.some((preset) => preset.name === chosen) ? chosen : '';
}
