import { z } from 'zod';
import type { DocumentEngine } from '../../data/document-engine.js';
import type { PaintTarget } from '../../domain/commands/command-types.js';

export const targetField = z
  .enum(['pixels', 'mask'])
  .default('pixels')
  .describe('"mask" paints on the layer mask instead (white shows, black hides, grays are partial)');

/** "layer_2", "layer_2's mask", plus a note when the edit was limited to the selection. */
export function describeTarget(engine: DocumentEngine, layerId: string, target: PaintTarget): string {
  const where = target === 'mask' ? `${layerId}'s mask` : layerId;
  return engine.doc.selection ? `${where} (only inside the selection)` : where;
}
