import { describe, expect, it } from 'vitest';
import { DocumentEngine } from './document-engine.js';
import { sampleColor } from './document-renderer.js';
import { napiPaintEnv } from './napi-paint-env.js';

async function freshEngine() {
  const engine = new DocumentEngine(napiPaintEnv);
  await engine.reset({ width: 20, height: 20, background: '#ffffff' }, 'rest');
  return engine;
}

describe('DocumentEngine.group', () => {
  it('records the whole group as one undo step', async () => {
    const engine = await freshEngine();
    await engine.group('batch', 'mcp', async () => {
      await engine.execute({ type: 'add_layer', layerId: 'layer_2', name: 'A', index: 1 }, 'mcp');
      await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'mcp');
    });
    expect(engine.log).toHaveLength(1);
    expect(engine.log[0].commands).toHaveLength(2);
    expect(sampleColor(engine.doc, 1, 1)).toBe('#ff0000');
    await engine.undo();
    expect(engine.doc.meta.layers).toHaveLength(1);
    expect(sampleColor(engine.doc, 1, 1)).toBe('#ffffff');
  });

  it('keeps nothing when a step fails', async () => {
    const engine = await freshEngine();
    const failing = engine.group('batch', 'mcp', async () => {
      await engine.execute({ type: 'add_layer', layerId: 'layer_2', name: 'A', index: 1 }, 'mcp');
      await engine.execute({ type: 'fill_layer', layerId: 'layer_2', color: '#ff0000' }, 'mcp');
      await engine.execute({ type: 'fill_layer', layerId: 'missing', color: '#00ff00' }, 'mcp');
    });
    await expect(failing).rejects.toThrow('does not exist');
    expect(engine.log).toHaveLength(0);
    expect(engine.doc.meta.layers).toHaveLength(1);
    expect(engine.activeLayer).toBe('layer_1');
    expect(sampleColor(engine.doc, 1, 1)).toBe('#ffffff');
  });

  it('makes edits from other clients wait until the group is done', async () => {
    const engine = await freshEngine();
    const order: string[] = [];
    const group = engine.group('batch', 'mcp', async () => {
      await engine.execute({ type: 'fill_layer', layerId: 'layer_1', color: '#ff0000' }, 'mcp');
      await new Promise((r) => setTimeout(r, 20));
      order.push('group done');
    });
    const outside = engine.execute({ type: 'fill_layer', layerId: 'layer_1', color: '#0000ff' }, 'ui').then(() => order.push('ui edit'));
    await Promise.all([group, outside]);
    expect(order).toEqual(['group done', 'ui edit']);
    expect(sampleColor(engine.doc, 1, 1)).toBe('#0000ff');
  });

  it('refuses undo inside a group instead of deadlocking', async () => {
    const engine = await freshEngine();
    await expect(engine.group('batch', 'mcp', () => engine.undo())).rejects.toThrow('Not allowed inside a batch');
  });
});
