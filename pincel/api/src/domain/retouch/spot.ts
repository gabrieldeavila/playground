import type { Point } from '../document/types.js';

/** A small blemish: a circle in canvas pixels. */
export interface Spot {
  center: Point;
  radius: number;
}
