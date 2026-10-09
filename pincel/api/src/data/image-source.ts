import { loadImage } from '@napi-rs/canvas';

const MAX_BYTES = 15 * 1024 * 1024;

export interface ImageSource {
  /** Always a data URI, so the command log replays without the network. */
  dataUri: string;
  width: number;
  height: number;
}

/** Accepts an http(s) URL or a data URI and returns it inlined with its size. */
export async function resolveImageSource(src: string): Promise<ImageSource> {
  const dataUri = src.startsWith('data:image/') ? src : await download(src);
  const image = await loadImage(dataUri);
  return { dataUri, width: image.width, height: image.height };
}

async function download(url: string): Promise<string> {
  if (!/^https?:\/\//.test(url)) throw new Error('Image source must be an http(s) URL or a data:image/... URI');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not download image: HTTP ${response.status}`);
  const type = response.headers.get('content-type')?.split(';')[0] ?? '';
  if (!type.startsWith('image/')) throw new Error(`URL is not an image (content-type "${type}")`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('Image is larger than 15 MB');
  return `data:${type};base64,${bytes.toString('base64')}`;
}
