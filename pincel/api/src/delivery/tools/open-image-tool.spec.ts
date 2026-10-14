import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '../../data/document-engine.js';
import { sampleColor } from '../../data/document-renderer.js';
import { napiPaintEnv } from '../../data/napi-paint-env.js';
import { testServices } from './test-services.js';
import { runTool } from './run-tool.js';
import { findTool } from './tool-catalog.js';

async function photoOnDisk(width: number, height: number, name = 'photo.png') {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#336699';
  ctx.fillRect(0, 0, width, height);
  const path = join(await mkdtemp(join(tmpdir(), 'pincel-')), name);
  await writeFile(path, canvas.toBuffer('image/png'));
  return path;
}

const openImage = (engine: DocumentEngine, input: unknown) => runTool(findTool('open_image')!, input, { engine, ...testServices, source: 'mcp' });

describe('open_image tool', () => {
  it('opens a local file as a new document sized to the photo', async () => {
    const engine = new DocumentEngine(napiPaintEnv);
    await openImage(engine, { path: await photoOnDisk(300, 200) });
    expect(engine.doc.meta).toMatchObject({ width: 300, height: 200 });
    expect(engine.doc.meta.layers.map((l) => l.name)).toEqual(['Photo']);
    expect(sampleColor(engine.doc, 150, 100)).toBe('#336699');
    expect(engine.log.map((e) => e.label)).toEqual(['open image']);
  });

  it('scales big photos down to maxSide', async () => {
    const engine = new DocumentEngine(napiPaintEnv);
    const result = await openImage(engine, { path: await photoOnDisk(400, 200), maxSide: 100 });
    expect(engine.doc.meta).toMatchObject({ width: 100, height: 50 });
    expect(result.text).toContain('scaled down from 400x200');
  });

  it('explains HEIC and unknown files instead of failing obscurely', async () => {
    const engine = new DocumentEngine(napiPaintEnv);
    await expect(openImage(engine, { path: '~/IMG_0001.HEIC' })).rejects.toThrow('Export the photo as JPEG');
    await expect(openImage(engine, { path: '/etc/hosts' })).rejects.toThrow('Not an image file');
    await expect(openImage(engine, {})).rejects.toThrow('exactly one of path or url');
  });
});

describe('place_image tool', () => {
  it('places a local file onto a layer', async () => {
    const engine = new DocumentEngine(napiPaintEnv);
    const call = (tool: string, input: unknown) => runTool(findTool(tool)!, input, { engine, ...testServices, source: 'mcp' });
    await call('create_document', { width: 100, height: 100 });
    await call('place_image', { path: await photoOnDisk(20, 10), x: 10, y: 10 });
    expect(sampleColor(engine.doc, 15, 15)).toBe('#336699');
    expect(sampleColor(engine.doc, 50, 50)).toBe('#ffffff');
    await expect(call('place_image', {})).rejects.toThrow('exactly one of path or src');
  });
});
