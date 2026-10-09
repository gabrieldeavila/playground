import type { DocumentMeta, LayerMeta } from './types.js';

export function findLayer(meta: DocumentMeta, layerId: string): LayerMeta {
  const layer = meta.layers.find((l) => l.id === layerId);
  if (!layer) throw new Error(`Layer "${layerId}" does not exist`);
  return layer;
}

export function layerIndex(meta: DocumentMeta, layerId: string): number {
  return meta.layers.indexOf(findLayer(meta, layerId));
}

export function insertLayer(meta: DocumentMeta, layer: LayerMeta, index: number): DocumentMeta {
  const layers = [...meta.layers];
  layers.splice(clampIndex(index, layers.length), 0, layer);
  return { ...meta, layers };
}

export function removeLayer(meta: DocumentMeta, layerId: string): DocumentMeta {
  findLayer(meta, layerId);
  return { ...meta, layers: meta.layers.filter((l) => l.id !== layerId) };
}

export function updateLayer(
  meta: DocumentMeta,
  layerId: string,
  changes: Partial<Omit<LayerMeta, 'id'>>,
): DocumentMeta {
  findLayer(meta, layerId);
  return {
    ...meta,
    layers: meta.layers.map((l) => (l.id === layerId ? { ...l, ...changes } : l)),
  };
}

export function moveLayer(meta: DocumentMeta, layerId: string, index: number): DocumentMeta {
  const layer = findLayer(meta, layerId);
  return insertLayer(removeLayer(meta, layerId), layer, index);
}

export function newLayer(id: string, name: string): LayerMeta {
  return { id, name, visible: true, opacity: 1, blendMode: 'normal', mask: null };
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(length, Math.round(index)));
}
