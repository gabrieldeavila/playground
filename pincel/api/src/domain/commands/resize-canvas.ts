import { flattenOnBlack } from '../paint/surface-ops.js';
import type { PaintEnv, Surface } from '../paint/surface.js';
import type { CommandOf } from './command-types.js';
import type { DocState } from './doc-state.js';

/** Crops or extends every layer, mask and the selection. The offset says where the old (0,0) lands. */
export function resizeCanvas(state: DocState, cmd: CommandOf<'resize_canvas'>, env: PaintEnv): DocState {
  const shift = (old: Surface, gray: boolean) => {
    const resized = env.createSurface(cmd.width, cmd.height);
    resized.getContext('2d').drawImage(old, cmd.offsetX, cmd.offsetY);
    if (gray) flattenOnBlack(resized);
    return resized;
  };
  const shiftAll = (surfaces: Map<string, Surface>, gray: boolean) =>
    new Map([...surfaces].map(([id, old]) => [id, shift(old, gray)] as const));

  return {
    meta: { ...state.meta, width: cmd.width, height: cmd.height },
    surfaces: shiftAll(state.surfaces, false),
    masks: shiftAll(state.masks, true),
    selection: state.selection ? shift(state.selection, true) : null,
  };
}
