import type { DocumentEngine } from '../../data/document-engine.js';
import { layerBounds } from '../../data/layer-bounds.js';
import { selectionBounds } from '../../data/selection-renderer.js';

/**
 * JSON view of the document shared by get_document, REST and the editor UI.
 * `withBounds` adds where each layer's visible pixels are (costs a pixel scan per layer).
 */
export function describeDocument(engine: DocumentEngine, { withBounds = false } = {}) {
  const { meta } = engine.doc;
  return {
    version: engine.currentVersion,
    width: meta.width,
    height: meta.height,
    activeLayerId: engine.activeLayer,
    layersBottomToTop: meta.layers.map((layer) =>
      withBounds ? { ...layer, bounds: layerBounds(engine.doc, layer.id) } : layer,
    ),
    /** null = no selection, every edit affects the whole layer. */
    selection: engine.doc.selection ? { bounds: selectionBounds(engine.doc) } : null,
    canUndo: engine.canUndo,
    canRedo: engine.canRedo,
    recentEdits: engine.log.slice(-20).map((entry) => ({
      type: entry.label,
      edits: entry.commands.length,
      source: entry.source,
      at: entry.at,
    })),
  };
}
