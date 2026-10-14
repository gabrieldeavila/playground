import { Router, type Response } from 'express';
import { readImageFile } from '../../data/image-source.js';
import type { PresetStore } from '../../data/preset-store.js';
import { describeError } from '../tools/run-tool.js';

/** Lets the editor show the saved presets (applying them is the agent's job, through apply_preset). */
export function presetRoutes(presets: PresetStore): Router {
  const router = Router();

  router.get('/api/presets', async (_req, res) => {
    res.json(await presets.list());
  });

  router.get('/api/presets/:name', async (req, res) => {
    try {
      const { preset, template } = await presets.load(req.params.name);
      const hasPreview = (await presets.readPreview(preset.name)) !== null;
      res.json({ ...preset, hasTemplate: template !== null, hasPreview });
    } catch (error) {
      notFound(res, error);
    }
  });

  router.get('/api/presets/:name/preview.png', async (req, res) => {
    const png = await presets.readPreview(req.params.name).catch(() => null);
    if (png) res.type('png').set('Cache-Control', 'no-store').send(png);
    else res.status(404).end();
  });

  // Only files the preset itself names, and only images (readImageFile checks).
  router.get('/api/presets/:name/assets/:key', async (req, res) => {
    try {
      const { preset } = await presets.load(req.params.name);
      const source = preset.assets[req.params.key];
      if (!source) throw new Error(`Preset "${preset.name}" has no asset "${req.params.key}"`);
      if (/^https?:\/\//.test(source)) return res.redirect(source);
      const [header, base64] = (await readImageFile(source)).dataUri.split(',');
      res.type(header.slice('data:'.length, header.indexOf(';'))).send(Buffer.from(base64, 'base64'));
    } catch (error) {
      notFound(res, error);
    }
  });

  return router;
}

function notFound(res: Response, error: unknown): void {
  res.status(404).json({ error: describeError(error) });
}
