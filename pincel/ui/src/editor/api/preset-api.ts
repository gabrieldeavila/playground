import type { PresetSummary } from '../domain/presets';

export async function fetchPresets(): Promise<PresetSummary[]> {
  const response = await fetch('/api/presets');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
