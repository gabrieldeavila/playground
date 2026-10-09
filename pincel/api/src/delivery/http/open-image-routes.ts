import express, { Router } from 'express';
import type { DocumentEngine } from '../../data/document-engine.js';
import { imageFromBytes } from '../../data/image-source.js';
import { openImage } from '../../data/open-image.js';
import { describeError } from '../tools/run-tool.js';

/** The editor's "Open image" / drag-and-drop: the raw file is the request body. */
export function openImageRoutes(engine: DocumentEngine): Router {
  const router = Router();

  router.post('/api/open-image', express.raw({ type: () => true, limit: '31mb' }), async (req, res) => {
    try {
      const image = await imageFromBytes(req.body as Buffer, req.get('content-type') ?? '');
      res.json(await openImage(engine, image, 'ui'));
    } catch (error) {
      res.status(400).json({ error: describeError(error) });
    }
  });

  return router;
}
