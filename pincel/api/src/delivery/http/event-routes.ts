import { Router } from 'express';
import type { DocumentEngine } from '../../data/document-engine.js';

/** Server-Sent Events so the editor redraws the moment an AI (or anyone) edits. */
export function eventRoutes(engine: DocumentEngine): Router {
  const router = Router();

  router.get('/api/events', (req, res) => {
    res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.flushHeaders();
    const send = (data: unknown) => res.write(`data: ${JSON.stringify(data)}\n\n`);
    send({ version: engine.currentVersion, reason: 'connected' });
    const unsubscribe = engine.changes.subscribe(send);
    const keepAlive = setInterval(() => res.write(': ping\n\n'), 20_000);
    req.on('close', () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });

  return router;
}
