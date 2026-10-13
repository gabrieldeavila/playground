import { Router } from 'express';
import { z } from 'zod';
import { mergeSettings, toPublicSettings } from '../../domain/agent/agent-settings.js';
import type { AgentSettingsStore } from '../../data/agent-settings-store.js';
import type { AgentSession } from '../agent/agent-session.js';
import { describeError } from '../tools/run-tool.js';

const settingsUpdate = z.object({
  baseURL: z.url().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  reasoningEffort: z.string().optional(),
});

const chatRequest = z.object({ message: z.string().min(1) });

/** The built-in agent: settings (the key never leaves this server) and a chat streamed as SSE. */
export function agentRoutes(session: AgentSession, settings: AgentSettingsStore): Router {
  const router = Router();

  router.get('/api/agent/settings', async (_req, res) => {
    res.json(toPublicSettings(await settings.load()));
  });

  router.put('/api/agent/settings', async (req, res) => {
    const update = settingsUpdate.safeParse(req.body);
    if (!update.success) {
      res.status(400).json({ error: z.prettifyError(update.error) });
      return;
    }
    const next = mergeSettings(await settings.load(), update.data);
    await settings.save(next);
    res.json(toPublicSettings(next));
  });

  router.post('/api/agent/chat', async (req, res) => {
    const request = chatRequest.safeParse(req.body);
    if (!request.success) {
      res.status(400).json({ error: z.prettifyError(request.error) });
      return;
    }
    const blocker = await session.blocker();
    if (blocker) {
      res.status(409).json({ error: blocker });
      return;
    }
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    try {
      await session.send(request.data.message, send);
    } catch (error) {
      send({ type: 'error', text: describeError(error) });
    }
    res.end();
  });

  router.post('/api/agent/stop', (_req, res) => {
    session.stop();
    res.status(204).end();
  });

  router.post('/api/agent/reset', (_req, res) => {
    session.reset();
    res.status(204).end();
  });

  return router;
}
