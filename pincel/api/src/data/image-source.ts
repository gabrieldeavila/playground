import { readFile, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { extname, resolve } from 'node:path';
import { loadImage } from '@napi-rs/canvas';

const MAX_BYTES = 30 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
};

export interface ImageSource {
  /** Always a data URI, so the command log replays without the network or the file. */
  dataUri: string;
  width: number;
  height: number;
}

/** Accepts an http(s) URL or a data URI and returns it inlined with its size. */
export async function resolveImageSource(src: string): Promise<ImageSource> {
  const dataUri = src.startsWith('data:image/') ? src : await download(src);
  return measured(dataUri);
}

/** Reads an image file from disk (e.g. a photo the user points the AI at). */
export async function readImageFile(path: string): Promise<ImageSource> {
  const fullPath = resolve(path.replace(/^~(?=$|\/)/, homedir()));
  const extension = extname(fullPath).toLowerCase();
  if (extension === '.heic' || extension === '.heif') {
    throw new Error('HEIC photos are not supported. Export the photo as JPEG or PNG first.');
  }
  const mime = MIME_BY_EXTENSION[extension];
  if (!mime) throw new Error(`Not an image file this editor can open: ${extension || 'no extension'}`);
  if ((await stat(fullPath)).size > MAX_BYTES) throw new Error('Image is larger than 30 MB');
  return imageFromBytes(await readFile(fullPath), mime);
}

/** Raw bytes (an upload) with their content type. */
export function imageFromBytes(bytes: Buffer, mime: string): Promise<ImageSource> {
  if (!mime.startsWith('image/')) throw new Error(`Not an image (content-type "${mime}")`);
  if (/hei[cf]/.test(mime)) throw new Error('HEIC photos are not supported. Export the photo as JPEG or PNG first.');
  if (bytes.length > MAX_BYTES) throw new Error('Image is larger than 30 MB');
  return measured(`data:${mime};base64,${bytes.toString('base64')}`);
}

async function measured(dataUri: string): Promise<ImageSource> {
  try {
    const image = await loadImage(dataUri);
    return { dataUri, width: image.width, height: image.height };
  } catch {
    throw new Error('Could not decode the image. Try a JPEG or PNG.');
  }
}

async function download(url: string): Promise<string> {
  if (!/^https?:\/\//.test(url)) throw new Error('Image source must be an http(s) URL or a data:image/... URI');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download image: HTTP ${response.status}`);
  const type = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!type.startsWith('image/')) throw new Error(`URL is not an image (content-type "${type}")`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('Image is larger than 30 MB');
  return `data:${type};base64,${bytes.toString('base64')}`;
}
