import { z } from 'zod';
import type { ToolContext, ToolDefinition, ToolResult } from './tool-definition.js';

/** Validates raw input against the tool's schema, applying defaults. */
export function parseToolInput(tool: ToolDefinition, rawInput: unknown) {
  return z.object(tool.input).parse(rawInput ?? {});
}

export async function runTool(tool: ToolDefinition, rawInput: unknown, ctx: ToolContext): Promise<ToolResult> {
  return tool.run(parseToolInput(tool, rawInput), ctx);
}

export function describeError(error: unknown): string {
  if (error instanceof z.ZodError) return z.prettifyError(error);
  return error instanceof Error ? error.message : String(error);
}
