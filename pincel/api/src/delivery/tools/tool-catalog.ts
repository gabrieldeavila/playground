import { createBatchTool } from './batch-tool.js';
import { documentTools } from './document-tools.js';
import { fillTools } from './fill-tools.js';
import { fontTools } from './font-tools.js';
import { historyTools } from './history-tools.js';
import { imageTools } from './image-tools.js';
import { layerTools } from './layer-tools.js';
import { layoutTools } from './layout-tools.js';
import { liquifyTool } from './liquify-tool.js';
import { maskTools } from './mask-tools.js';
import { openImageTool } from './open-image-tool.js';
import { paintTools } from './paint-tools.js';
import { retouchTools } from './retouch-tools.js';
import { selectionTools } from './selection-tools.js';
import { shapeTools } from './shape-tools.js';
import { textTools } from './text-tools.js';
import type { ToolDefinition } from './tool-definition.js';

const SINGLE_TOOLS: ToolDefinition[] = [
  ...documentTools,
  openImageTool,
  ...fontTools,
  ...layoutTools,
  ...layerTools,
  ...maskTools,
  ...selectionTools,
  ...shapeTools,
  ...paintTools,
  ...textTools,
  ...fillTools,
  ...retouchTools,
  liquifyTool,
  ...imageTools,
  ...historyTools,
];

export const TOOLS: ToolDefinition[] = [...SINGLE_TOOLS, createBatchTool(SINGLE_TOOLS)];

export function findTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.name === name);
}
