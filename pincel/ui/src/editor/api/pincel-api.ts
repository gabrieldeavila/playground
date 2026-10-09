import type { DocumentSnapshot, ToolCall } from '../domain/types';

export interface ToolResponse {
  text: string;
  data?: unknown;
}

/** Calls an editor tool exactly the way an AI would, tagged as coming from the UI. */
export async function callTool({ name, input }: ToolCall): Promise<ToolResponse> {
  const response = await fetch(`/api/tools/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-pincel-source': 'ui' },
    body: JSON.stringify(input),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body as ToolResponse;
}

export async function fetchDocument(): Promise<DocumentSnapshot> {
  const response = await fetch('/api/document');
  if (!response.ok) throw new Error(`Could not load the document (HTTP ${response.status})`);
  return response.json();
}

export const renderUrl = (version: number) => `/api/render.png?v=${version}`;

export const layerThumbnailUrl = (layerId: string, version: number) => `/api/layers/${layerId}.png?maxSize=96&v=${version}`;

export const maskThumbnailUrl = (layerId: string, version: number) => `/api/layers/${layerId}/mask.png?maxSize=96&v=${version}`;

export const selectionOverlayUrl = (version: number, maxSize: number) => `/api/selection.png?maxSize=${maxSize}&v=${version}`;
