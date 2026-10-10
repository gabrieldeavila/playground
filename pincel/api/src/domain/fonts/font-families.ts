const GENERIC_FAMILIES = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui']);

/** The family names in a CSS font-family list, e.g. `"Bebas Neue", Impact, sans-serif`. */
export function familyNames(fontFamily: string): string[] {
  return fontFamily
    .split(',')
    .map((name) => name.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

export function isGenericFamily(name: string): boolean {
  return GENERIC_FAMILIES.has(name.toLowerCase());
}

/** Families in the list that aren't installed. Generic families always resolve. */
export function missingFamilies(fontFamily: string, isInstalled: (name: string) => boolean): string[] {
  return familyNames(fontFamily).filter((name) => !isGenericFamily(name) && !isInstalled(name));
}
