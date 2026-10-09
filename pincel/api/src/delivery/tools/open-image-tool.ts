import { z } from 'zod';
import { readImageFile, resolveImageSource } from '../../data/image-source.js';
import { DEFAULT_MAX_SIDE, openImage } from '../../data/open-image.js';
import { defineTool } from './tool-definition.js';

export const openImageTool = defineTool({
  name: 'open_image',
  title: 'Open image',
  description:
    'Opens a photo as a new document (replacing the current one and its history): the canvas takes the image size and the photo goes on a "Photo" layer. Give a local file path (jpg, png, webp, gif, avif; ~ allowed) or an http(s) URL. Edit non-destructively on top: adjustment layers with blend modes, masks, and filters on duplicates.',
  input: {
    path: z.string().optional().describe('Local image file, e.g. "~/Pictures/me.jpg"'),
    url: z.string().optional().describe('http(s) URL or data:image URI, if not using path'),
    maxSide: z.number().int().min(64).max(8192).default(DEFAULT_MAX_SIDE).describe('Big photos are scaled down to this longest side'),
  },
  async run({ path, url, maxSide }, { engine, source }) {
    if (!path === !url) throw new Error('Pass exactly one of path or url');
    const image = path ? await readImageFile(path) : await resolveImageSource(url!);
    const opened = await openImage(engine, image, source, maxSide);
    const note = opened.scaled ? ` (scaled down from ${image.width}x${image.height})` : '';
    return {
      text: `Opened ${opened.width}x${opened.height}${note}. The photo is on layer_1 "Photo". Call render_image to look at it.`,
      data: opened,
    };
  },
});
