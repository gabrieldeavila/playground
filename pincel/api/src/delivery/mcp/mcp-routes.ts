import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router, type Request, type Response } from 'express';
import type { ToolServices } from '../tools/tool-definition.js';
import { createMcpServer } from './create-mcp-server.js';

/** Stateless Streamable HTTP endpoint: a fresh MCP server per request, all sharing one document. */
export function mcpRoutes(services: ToolServices): Router {
  const router = Router();

  router.post('/mcp', async (req, res) => {
    const server = createMcpServer(services);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  const notAllowed = (_req: Request, res: Response) =>
    res.status(405).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null });
  router.get('/mcp', notAllowed);
  router.delete('/mcp', notAllowed);

  return router;
}
