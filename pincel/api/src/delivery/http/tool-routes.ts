import { Router } from 'express';
import { z } from 'zod';
import type { DocumentEngine } from '../../data/document-engine.js';
import type { CommandSource } from '../../data/logged-command.js';
import { findTool, TOOLS } from '../tools/tool-catalog.js';
import { describeError, runTool } from '../tools/run-tool.js';

/**
 * REST access to the same tools, for any AI framework without MCP.
 * GET /api/tools returns them in the Claude API tool format (name, description, input_schema).
 */
export function toolRoutes(engine: DocumentEngine): Router {
  const router = Router();

  router.get('/api/tools', (_req, res) => {
    res.json(
      TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: z.toJSONSchema(z.object(tool.input), { io: 'input' }),
      })),
    );
  });

  router.post('/api/tools/:name', async (req, res) => {
    const tool = findTool(req.params.name);
    if (!tool) {
      res.status(404).json({ error: `Unknown tool "${req.params.name}"` });
      return;
    }
    const source: CommandSource = req.get('x-pincel-source') === 'ui' ? 'ui' : 'rest';
    try {
      const result = await runTool(tool, req.body, { engine, source });
      res.json({ text: result.text, data: result.data, image: result.image?.toString('base64') });
    } catch (error) {
      res.status(400).json({ error: describeError(error) });
    }
  });

  return router;
}
