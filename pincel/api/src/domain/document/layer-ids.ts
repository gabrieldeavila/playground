import type { DocumentMeta } from './types.js';

const PREFIX = 'layer_';

export function nextLayerId(meta: DocumentMeta): string {
  const numbers = meta.layers.map((l) => Number(l.id.slice(PREFIX.length)) || 0);
  return `${PREFIX}${Math.max(0, ...numbers) + 1}`;
}
