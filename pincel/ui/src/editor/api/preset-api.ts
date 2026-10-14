import type { PresetDetails, PresetSummary } from '../domain/presets';

export async function fetchPresets(): Promise<PresetSummary[]> {
  return json(await fetch('/api/presets'));
}

export async function fetchPreset(name: string): Promise<PresetDetails> {
  return json(await fetch(`/api/presets/${encodeURIComponent(name)}`));
}

/** `version` changes the URL so a newer preview isn't served from the browser cache. */
export function presetPreviewUrl(name: string, version: number): string {
  return `/api/presets/${encodeURIComponent(name)}/preview.png?v=${version}`;
}

export function presetAssetUrl(name: string, key: string): string {
  return `/api/presets/${encodeURIComponent(name)}/assets/${encodeURIComponent(key)}`;
}

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body as T;
}
