import { join } from 'node:path';
import { createDocumentFile } from './data/document-file.js';
import { DocumentEngine } from './data/document-engine.js';
import { napiPaintEnv } from './data/napi-paint-env.js';
import { createApp } from './delivery/http/create-app.js';

const PORT = Number(process.env.PORT ?? 4300);
const HOST = '127.0.0.1';
const DATA_FILE = process.env.PINCEL_DATA_FILE ?? join(import.meta.dirname, '../.data/document.json');

const engine = new DocumentEngine(napiPaintEnv, createDocumentFile(DATA_FILE));
await engine.restore();

createApp(engine).listen(PORT, HOST, () => {
  console.log(`Pincel API on http://localhost:${PORT}`);
  console.log(`  MCP endpoint:  http://localhost:${PORT}/mcp`);
  console.log(`  REST tools:    http://localhost:${PORT}/api/tools`);
});
