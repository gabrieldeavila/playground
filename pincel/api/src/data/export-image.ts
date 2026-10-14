import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import type { DocState } from '../domain/commands/doc-state.js';
import { exportFormatOf, type ExportFormat } from '../domain/document/export-format.js';
import { compositeOf } from './document-renderer.js';
import { localPath } from './local-path.js';

export interface ExportOptions {
  path: string;
  /** 0..100, for JPEG and WebP. */
  quality: number;
  /** Fills transparent areas when the format has no alpha (JPEG). */
  background: string;
  overwrite: boolean;
}

export interface ExportedImage {
  path: string;
  width: number;
  height: number;
  bytes: number;
}

/** Writes the full-resolution composite to disk as PNG, JPEG or WebP. */
export async function exportImage(state: DocState, options: ExportOptions): Promise<ExportedImage> {
  const path = localPath(options.path);
  const format = exportFormatOf(path);
  const bytes = encode(state, format, options);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes, { flag: options.overwrite ? 'w' : 'wx' }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') throw new Error(`${path} already exists. Pass overwrite: true to replace it.`);
    throw error;
  });
  return { path, width: state.meta.width, height: state.meta.height, bytes: bytes.length };
}

function encode(state: DocState, format: ExportFormat, options: ExportOptions): Buffer {
  const composite = compositeOf(state);
  if (format === 'png') return composite.toBuffer('image/png');
  if (format === 'webp') return composite.toBuffer('image/webp', options.quality);
  // JPEG has no alpha: flatten onto the background first.
  const flat = createCanvas(composite.width, composite.height);
  const ctx = flat.getContext('2d');
  ctx.fillStyle = options.background;
  ctx.fillRect(0, 0, flat.width, flat.height);
  ctx.drawImage(composite, 0, 0);
  return flat.toBuffer('image/jpeg', options.quality);
}
