import { z } from 'zod';
import { exportImage } from '../../data/export-image.js';
import { defineTool } from './tool-definition.js';
import { colorField } from './tool-fields.js';

export const exportTool = defineTool({
  name: 'export_image',
  title: 'Export image',
  description:
    'Saves the finished image to a file at full resolution. The extension picks the format: .png (keeps transparency, e.g. a cut-out with the background removed), .jpg (smaller, transparent areas get `background`) or .webp. Folders are created as needed.',
  input: {
    path: z.string().describe('Where to save, e.g. "~/Desktop/post.png"'),
    quality: z.number().int().min(1).max(100).default(92).describe('JPEG/WebP quality'),
    background: colorField('JPEG only: color behind transparent areas').default('#ffffff'),
    overwrite: z.boolean().default(false).describe('Replace the file if it already exists'),
  },
  readOnly: true,
  async run(options, { engine }) {
    const saved = await exportImage(engine.doc, options);
    const kb = Math.round(saved.bytes / 1024);
    return { text: `Saved ${saved.width}x${saved.height} image to ${saved.path} (${kb} KB)`, data: saved };
  },
});
