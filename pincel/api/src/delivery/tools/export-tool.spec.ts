import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '../../data/document-engine.js';
import { napiPaintEnv } from '../../data/napi-paint-env.js';
import { runTool } from './run-tool.js';
import { testServices } from './test-services.js';
import { findTool } from './tool-catalog.js';

async function setup() {
  const engine = new DocumentEngine(napiPaintEnv);
  const call = (tool: string, input: unknown) => runTool(findTool(tool)!, input, { engine, ...testServices, source: 'mcp' });
  await call('create_document', { width: 40, height: 20, background: 'transparent' });
  await call('draw_rect', { rect: { x: 0, y: 0, width: 20, height: 20 }, fill: '#ff0000' });
  return { call, dir: await mkdtemp(join(tmpdir(), 'pincel-export-')) };
}

async function pixelAt(path: string, x: number, y: number) {
  const image = await loadImage(await readFile(path));
  const canvas = createCanvas(image.width, image.height);
  canvas.getContext('2d').drawImage(image, 0, 0);
  return { size: [image.width, image.height], rgba: [...canvas.getContext('2d').getImageData(x, y, 1, 1).data] };
}

describe('export_image tool', () => {
  it('writes a full-size PNG that keeps transparency, creating folders', async () => {
    const { call, dir } = await setup();
    const path = join(dir, 'nested', 'out.png');
    const result = await call('export_image', { path });
    expect(result.text).toContain(`Saved 40x20 image to ${path}`);
    expect(await pixelAt(path, 30, 10)).toEqual({ size: [40, 20], rgba: [0, 0, 0, 0] });
    expect((await pixelAt(path, 5, 5)).rgba).toEqual([255, 0, 0, 255]);
  });

  it('flattens JPEG onto the background color', async () => {
    const { call, dir } = await setup();
    const path = join(dir, 'out.jpg');
    await call('export_image', { path, background: '#0000ff', quality: 100 });
    const [r, g, b] = (await pixelAt(path, 35, 10)).rgba;
    expect(r).toBeLessThan(10);
    expect(g).toBeLessThan(10);
    expect(b).toBeGreaterThan(245);
  });

  it('refuses to overwrite unless asked, and only writes image files', async () => {
    const { call, dir } = await setup();
    const path = join(dir, 'taken.png');
    await writeFile(path, 'keep me');
    await expect(call('export_image', { path })).rejects.toThrow('already exists');
    expect(await readFile(path, 'utf8')).toBe('keep me');
    await call('export_image', { path, overwrite: true });
    expect((await pixelAt(path, 5, 5)).size).toEqual([40, 20]);
    await expect(call('export_image', { path: join(dir, 'x.sh') })).rejects.toThrow('must end in .png');
  });
});
