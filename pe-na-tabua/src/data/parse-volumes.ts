import { DEFAULT_VOLUMES, MAX_VOLUME, VOLUME_KEYS, type Volumes } from '../domain/settings/volumes'

// Lê os volumes salvos; cada um que faltar ou vier estranho volta ao padrão.
export function parseVolumes(text: string | null): Volumes {
  const raw = parseJson(text)
  const saved = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  return Object.fromEntries(VOLUME_KEYS.map((key) => [key, levelOr(saved[key], DEFAULT_VOLUMES[key])])) as Volumes
}

function levelOr(value: unknown, fallback: number): number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_VOLUME ? (value as number) : fallback
}

function parseJson(text: string | null): unknown {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}
