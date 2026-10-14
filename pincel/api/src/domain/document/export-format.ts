import { extname } from 'node:path';

export type ExportFormat = 'png' | 'jpeg' | 'webp';

const FORMAT_BY_EXTENSION: Record<string, ExportFormat> = {
  '.png': 'png',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.webp': 'webp',
};

/** The file format a path asks for, from its extension. Only image files can be written. */
export function exportFormatOf(path: string): ExportFormat {
  const format = FORMAT_BY_EXTENSION[extname(path).toLowerCase()];
  if (!format) throw new Error('Export path must end in .png, .jpg, .jpeg or .webp');
  return format;
}
