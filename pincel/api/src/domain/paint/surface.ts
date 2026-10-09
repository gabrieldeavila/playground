import type { Canvas, Image, SKRSContext2D } from '@napi-rs/canvas';

/** A layer's pixels. Typed with @napi-rs/canvas, but only the standard Canvas 2D API is used. */
export type Surface = Canvas;
export type Ctx = SKRSContext2D;

/** What painting needs from the outside world. */
export interface PaintEnv {
  createSurface(width: number, height: number): Surface;
  loadImage(src: string): Promise<Image>;
}
