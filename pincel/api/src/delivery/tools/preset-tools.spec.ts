import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { describe, expect, it } from 'vitest';
import { DocumentEngine } from '../../data/document-engine.js';
import { sampleColor } from '../../data/document-renderer.js';
import { createFontStore } from '../../data/font-store.js';
import { napiPaintEnv } from '../../data/napi-paint-env.js';
import { createPresetStore } from '../../data/preset-store.js';
import { runTool } from './run-tool.js';
import { findTool } from './tool-catalog.js';

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'pincel-presets-'));
  const engine = new DocumentEngine(napiPaintEnv);
  const services = { engine, fonts: createFontStore(join(dir, 'fonts')), presets: createPresetStore(join(dir, 'presets')) };
  const call = (tool: string, input: unknown) => runTool(findTool(tool)!, input, { ...services, source: 'agent' });
  return { engine, call, dir, presets: services.presets };
}

const promo = {
  name: 'promo-post',
  description: 'Square promo post',
  instructions: 'Product centered, price at the bottom in primary.',
  canvas: { width: 108, height: 108, background: '#112233' },
  fonts: ['Helvetica'],
  colors: { primary: '#e63946' },
  assets: { logo: '~/brand/logo.png' },
};

describe('preset tools', () => {
  it('saves, lists and applies a preset as a blank canvas with its brief', async () => {
    const { engine, call, presets } = await setup();
    expect((await call('list_presets', {})).text).toContain('No presets yet');
    await call('save_preset', promo);
    expect(await presets.list()).toEqual([{ name: 'promo-post', description: 'Square promo post', hasTemplate: false, hasPreview: true }]);
    expect((await call('list_presets', {})).text).toBe('promo-post: Square promo post');

    const applied = await call('apply_preset', { name: 'promo-post' });
    expect(engine.doc.meta).toMatchObject({ width: 108, height: 108 });
    expect(sampleColor(engine.doc, 50, 50)).toBe('#112233');
    expect(applied.text).toContain('Fonts ready: "Helvetica"');
    expect(applied.text).toContain('logo = ~/brand/logo.png');
    expect(applied.text).toContain('Instructions:\nProduct centered');
  });

  it('keeps the current document as a template and rebuilds it as one undo step', async () => {
    const { engine, call } = await setup();
    await call('create_document', { width: 60, height: 30, background: '#ffffff' });
    await call('add_layer', { name: 'Band' });
    await call('draw_rect', { rect: { x: 0, y: 0, width: 60, height: 10 }, fill: '#00ff00' });
    await call('undo', {});
    await call('draw_rect', { rect: { x: 0, y: 20, width: 60, height: 10 }, fill: '#0000ff' });
    await call('save_preset', { name: 'band', description: 'd', instructions: 'i', includeDocument: true });

    await call('create_document', { width: 10, height: 10 });
    const applied = await call('apply_preset', { name: 'band' });
    expect(applied.text).toContain("the preset's template (60x30)");
    expect(engine.doc.meta.layers.map((l) => l.name)).toEqual(['Background', 'Band']);
    expect(sampleColor(engine.doc, 5, 5)).toBe('#ffffff');
    expect(sampleColor(engine.doc, 5, 25)).toBe('#0000ff');
    expect(engine.log.map((e) => e.label)).toEqual(['preset band']);
    expect((await call('list_presets', {})).text).toContain('(has a template document)');
  });

  it('protects existing presets and explains unknown or broken ones', async () => {
    const { call, dir, presets } = await setup();
    await call('save_preset', promo);
    await expect(call('save_preset', promo)).rejects.toThrow('already exists');
    await call('save_preset', { ...promo, description: 'Updated', overwrite: true });
    await expect(call('apply_preset', { name: 'nope' })).rejects.toThrow('No preset "nope"');
    await expect(call('apply_preset', { name: '../agent' })).rejects.toThrow();

    await writeFile(join(dir, 'presets', 'broken.json'), JSON.stringify({ description: 'no instructions' }));
    expect((await call('list_presets', {})).text).toBe('promo-post: Updated');
    await expect(call('apply_preset', { name: 'broken' })).rejects.toThrow('invalid');

    await call('delete_preset', { name: 'promo-post' });
    expect((await call('list_presets', {})).text).toContain('No presets yet');
    await presets.savePreview('promo-post', Buffer.from('png'));
    expect(await presets.readPreview('promo-post')).toBeNull();
  });

  it('warns about a font it cannot load instead of failing', async () => {
    const { call, dir } = await setup();
    await call('save_preset', { ...promo, fonts: [] });
    const preset = { ...promo, fonts: [{ family: 'Missing Brand', source: join(dir, 'missing.otf') }] };
    await writeFile(join(dir, 'presets', 'promo-post.json'), JSON.stringify(preset));
    const applied = await call('apply_preset', { name: 'promo-post' });
    expect(applied.text).toMatch(/Warning: could not load font "Missing Brand"/);
    expect(applied.text).toContain('Instructions:');
  });
});
