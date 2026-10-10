import { localhostHostValidation } from '@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js';
import express, { type Express } from 'express';
import { mcpRoutes } from '../mcp/mcp-routes.js';
import type { ToolServices } from '../tools/tool-definition.js';
import { documentRoutes } from './document-routes.js';
import { eventRoutes } from './event-routes.js';
import { openImageRoutes } from './open-image-routes.js';
import { toolRoutes } from './tool-routes.js';

export function createApp(services: ToolServices): Express {
  const { engine } = services;
  const app = express();
  // Only answer requests addressed to localhost (blocks DNS-rebinding from web pages).
  app.use(localhostHostValidation());
  // Before the JSON parser: the body is the raw image file.
  app.use(openImageRoutes(engine));
  // Big limit: place_image accepts data URIs.
  app.use(express.json({ limit: '25mb' }));
  app.use(mcpRoutes(services));
  app.use(toolRoutes(services));
  app.use(documentRoutes(engine));
  app.use(eventRoutes(engine));
  return app;
}
