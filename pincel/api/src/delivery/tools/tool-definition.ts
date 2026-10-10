import { z } from 'zod';
import type { DocumentEngine } from '../../data/document-engine.js';
import type { FontStore } from '../../data/font-store.js';
import type { CommandSource } from '../../data/logged-command.js';

/** What tools work with: the open document and the saved fonts. */
export interface ToolServices {
  engine: DocumentEngine;
  fonts: FontStore;
}

export interface ToolContext extends ToolServices {
  source: CommandSource;
}

export interface ToolResult {
  text: string;
  /** PNG the caller can look at (render_image). */
  image?: Buffer;
  /** Structured data for REST callers. */
  data?: unknown;
}

export interface ToolDefinition<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  input: Shape;
  /** True for tools that only look at the document. */
  readOnly?: boolean;
  run(input: z.infer<z.ZodObject<Shape>>, ctx: ToolContext): Promise<ToolResult>;
}

export function defineTool<Shape extends z.ZodRawShape>(tool: ToolDefinition<Shape>): ToolDefinition {
  return tool as unknown as ToolDefinition;
}
