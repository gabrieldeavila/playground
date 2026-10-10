import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '../../data/document-engine.js';
import { sampleColor } from '../../data/document-renderer.js';
import { napiPaintEnv } from '../../data/napi-paint-env.js';
import { runTool } from './run-tool.js';
import { testFontStore } from './test-font-store.js';
import { findTool } from './tool-catalog.js';

async function setup() {
  const engine = new DocumentEngine(napiPaintEnv);
  await engine.reset({ width: 400, height: 300, background: '#ffffff' }, 'rest');
  const call = (tool: string, input: unknown) => runTool(findTool(tool)!, input, { engine, fonts: testFontStore, source: 'mcp' });
  return { engine, call };
}

interface TextData {
  box: { x: number; y: number; width: number; height: number };
  size: number;
  lines: string[];
  notes: string[];
}

describe('draw_text tool', () => {
  it('shrinks text to fill a box and centers it', async () => {
    const { call } = await setup();
    const box = { x: 50, y: 50, width: 300, height: 200 };
    const result = await call('draw_text', { text: 'SUMMER FEST', box, size: 400, fit: 'shrink', align: 'center', verticalAlign: 'middle' });
    const data = result.data as TextData;
    expect(data.size).toBeLessThan(400);
    expect(data.box.x).toBeGreaterThanOrEqual(50);
    expect(data.box.x + data.box.width).toBeLessThanOrEqual(350);
    expect(data.box.y + data.box.height).toBeLessThanOrEqual(250);
    expect(data.notes).toEqual([]);
  });

  it('wraps text to the box width', async () => {
    const { call } = await setup();
    const result = await call('draw_text', { text: 'live music all night long', box: { x: 0, y: 0, width: 150 }, size: 30 });
    expect((result.data as TextData).lines.length).toBeGreaterThan(1);
  });

  it('draws an outline outside the letters', async () => {
    const { engine, call } = await setup();
    await call('draw_text', { text: 'I', position: [200, 50], size: 200, weight: 'bold', color: '#ff0000', stroke: '#0000ff', strokeWidth: 10, align: 'center' });
    expect(sampleColor(engine.doc, 200, 150)).toBe('#ff0000');
    const row = Array.from({ length: 200 }, (_, x) => sampleColor(engine.doc, x + 100, 150));
    expect(row).toContain('#0000ff');
  });

  it('warns when the font is not installed', async () => {
    const { call } = await setup();
    const result = await call('draw_text', { text: 'hi', position: [0, 0], font: 'Definitely Not A Font, sans-serif' });
    expect(result.text).toContain('Font "Definitely Not A Font" is not installed');
  });

  it('rejects text with neither position nor box', async () => {
    const { call } = await setup();
    await expect(call('draw_text', { text: 'hi' })).rejects.toThrow(/position or box/);
  });
});

describe('measure_text tool', () => {
  it('measures letter spacing without the trailing gap', async () => {
    const { call } = await setup();
    const plain = (await call('measure_text', { text: 'AB', size: 40 })).data as { width: number };
    const spaced = (await call('measure_text', { text: 'AB', size: 40, letterSpacing: 10 })).data as { width: number };
    expect(spaced.width - plain.width).toBeCloseTo(10, 0);
  });
});
