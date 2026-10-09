export type SelectionMode = 'replace' | 'add' | 'subtract' | 'intersect';

/** Photoshop modifiers: Shift adds, Alt subtracts, both intersect. */
export function selectionModeFromKeys({ shift, alt }: { shift: boolean; alt: boolean }): SelectionMode {
  if (shift && alt) return 'intersect';
  if (shift) return 'add';
  if (alt) return 'subtract';
  return 'replace';
}
