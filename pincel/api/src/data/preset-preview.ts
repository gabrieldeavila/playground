import type { DocState } from '../domain/commands/doc-state.js';
import { renderPng } from './document-renderer.js';
import type { PresetStore } from './preset-store.js';

const PREVIEW_SIZE = 720;

/** Saves the document as it is now as the preset's preview picture. */
export async function savePresetPreview(presets: PresetStore, name: string, state: DocState): Promise<void> {
  await presets.savePreview(name, renderPng(state, { maxSize: PREVIEW_SIZE }));
}
