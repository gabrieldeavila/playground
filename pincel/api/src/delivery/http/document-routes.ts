import { Router } from 'express';
import type { DocumentEngine } from '../../data/document-engine.js';
import { renderPng } from '../../data/document-renderer.js';
import { renderSelectionOverlay } from '../../data/selection-renderer.js';
import { describeDocument } from '../tools/describe-document.js';

export function documentRoutes(engine: DocumentEngine): Router {
  const router = Router();

  router.get('/api/document', (_req, res) => {
    res.json(describeDocument(engine));
  });

  router.get('/api/render.png', (req, res) => {
    const maxSize = Number(req.query.maxSize) || undefined;
    sendPng(res, () => renderPng(engine.doc, { maxSize }));
  });

  router.get('/api/selection.png', (req, res) => {
    const overlay = renderSelectionOverlay(engine.doc, Number(req.query.maxSize) || undefined);
    if (overlay) sendPng(res, () => overlay);
    else res.status(204).end();
  });

  router.get('/api/layers/:layerId/mask.png', (req, res) => {
    const maxSize = Number(req.query.maxSize) || 96;
    sendPng(res, () => renderPng(engine.doc, { layerId: req.params.layerId, mask: true, maxSize }));
  });

  router.get('/api/layers/:layerId.png', (req, res) => {
    const maxSize = Number(req.query.maxSize) || 96;
    sendPng(res, () => renderPng(engine.doc, { layerId: req.params.layerId, maxSize }));
  });

  return router;
}

function sendPng(res: import('express').Response, render: () => Buffer): void {
  try {
    res.type('png').set('Cache-Control', 'no-store').send(render());
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : String(error) });
  }
}
