import { z } from 'zod';
import type { ToolDefinition } from './tool-definition.js';

/** The tool's input as JSON Schema, for REST callers and the built-in agent. */
export function toolJsonSchema(tool: ToolDefinition): Record<string, unknown> {
  return z.toJSONSchema(z.object(tool.input), { io: 'input' }) as Record<string, unknown>;
}
