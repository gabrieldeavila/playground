import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '../../data/document-engine.js';
import { napiPaintEnv } from '../../data/napi-paint-env.js';
import { testFontStore } from './test-font-store.js';
import { sampleColor } from '../../data/document-renderer.js';
import { runTool } from './run-tool.js';
import { findTool } from './tool-catalog.js';

async function setup() {
  const engine = new DocumentEngine(napiPaintEnv);
  await engine.reset({ width: 100, height: 100, background: '#ffffff' }, 'rest');
  const batch = (input: unknown) => runTool(findTool('batch')!, input, { engine, fonts: testFontStore, source: 'mcp' });
  return { engine, batch };
}

describe('batch tool', () => {
  it('runs steps in order on the layer the batch created', async () => {
    const { engine, batch } = await setup();
    const result = await batch({
      label: 'red square',
      calls: [
        { tool: 'add_layer', input: { name: 'Square' } },
        { tool: 'draw_rect', input: { rect: { x: 0, y: 0, width: 50, height: 50 }, fill: '#ff0000' } },
      ],
    });
    expect(result.text).toContain('1. add_layer');
    expect(engine.log.map((e) => e.label)).toEqual(['red square']);
    expect(sampleColor(engine.doc, 10, 10, 'layer_2')).toBe('#ff0000');
  });

  it('reports every invalid step before applying anything', async () => {
    const { engine, batch } = await setup();
    const attempt = batch({
      calls: [
        { tool: 'draw_rect', input: { rect: { x: 0 } } },
        { tool: 'fill_layer', input: { color: 'red' } },
        { tool: 'draw_ellipse', input: {} },
      ],
    });
    await expect(attempt).rejects.toThrow(/Step 1 \(draw_rect\)[\s\S]*Step 3 \(draw_ellipse\)/);
    expect(engine.log).toHaveLength(0);
  });

  it('rejects tools that rewind or replace the document', async () => {
    const { batch } = await setup();
    await expect(batch({ calls: [{ tool: 'undo', input: {} }] })).rejects.toThrow();
  });
});
