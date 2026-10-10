import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TOOLS } from '../tools/tool-catalog.js';
import type { ToolServices } from '../tools/tool-definition.js';
import { SERVER_INSTRUCTIONS } from './server-instructions.js';
import { toMcpError, toMcpResult } from './to-mcp-result.js';

/** Exposes every editor tool over MCP. The SDK validates input and applies schema defaults. */
export function createMcpServer(services: ToolServices): McpServer {
  const server = new McpServer({ name: 'pincel', version: '0.1.0' }, { instructions: SERVER_INSTRUCTIONS });
  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: { readOnlyHint: tool.readOnly ?? false, destructiveHint: false },
      },
      async (input: Record<string, unknown>) => {
        try {
          return toMcpResult(await tool.run(input, { ...services, source: 'mcp' }));
        } catch (error) {
          return toMcpError(error);
        }
      },
    );
  }
  return server;
}
