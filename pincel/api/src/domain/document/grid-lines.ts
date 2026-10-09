const NICE_STEPS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];

/** A round grid spacing that gives roughly `targetLines` lines across the longer side. */
export function niceGridSpacing(width: number, height: number, targetLines = 10): number {
  const ideal = Math.max(width, height) / targetLines;
  return NICE_STEPS.find((step) => step >= ideal) ?? NICE_STEPS[NICE_STEPS.length - 1];
}

/** Multiples of `spacing` strictly inside (start, end). */
export function gridPositions(start: number, end: number, spacing: number): number[] {
  const positions: number[] = [];
  for (let p = Math.floor(start / spacing + 1) * spacing; p < end; p += spacing) positions.push(p);
  return positions;
}
