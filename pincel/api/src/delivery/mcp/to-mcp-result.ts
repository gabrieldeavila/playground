import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolResult } from '../tools/tool-definition.js';

export function toMcpResult(result: ToolResult): CallToolResult {
  const content: CallToolResult['content'] = [{ type: 'text', text: result.text }];
  if (result.image) content.push({ type: 'image', data: result.image.toString('base64'), mimeType: 'image/png' });
  return { content };
}

export function toMcpError(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { isError: true, content: [{ type: 'text', text: message }] };
}
