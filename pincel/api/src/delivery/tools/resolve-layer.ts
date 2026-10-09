import type { DocumentEngine } from '../../data/document-engine.js';
import { findLayer } from '../../domain/document/layer-stack.js';

export function resolveLayer(engine: DocumentEngine, layerId?: string): string {
  return findLayer(engine.doc.meta, layerId ?? engine.activeLayer).id;
}
