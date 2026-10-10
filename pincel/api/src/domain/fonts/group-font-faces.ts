export interface FontFamilySummary {
  family: string;
  weights: string[];
}

/** One entry per family with its weights in order, e.g. Montserrat: 400, 900. */
export function groupFontFaces(faces: { family: string; weight: string }[]): FontFamilySummary[] {
  const byFamily = new Map<string, Set<string>>();
  for (const { family, weight } of faces) byFamily.set(family, (byFamily.get(family) ?? new Set()).add(weight));
  return [...byFamily].map(([family, weights]) => ({ family, weights: [...weights].sort((a, b) => Number(a) - Number(b)) }));
}
