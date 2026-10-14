import { Router } from 'express';
import type { PresetStore } from '../../data/preset-store.js';

/** Lets the editor offer the saved presets (applying them is the agent's job, through apply_preset). */
export function presetRoutes(presets: PresetStore): Router {
  const router = Router();

  router.get('/api/presets', async (_req, res) => {
    res.json(await presets.list());
  });

  return router;
}
