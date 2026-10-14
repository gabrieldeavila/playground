import { basename, extname, join } from 'node:path';

export const BATCH_FORMATS = ['png', 'jpg', 'webp'] as const;
export type BatchFormat = (typeof BATCH_FORMATS)[number];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif'];

export interface BatchJob {
  input: string;
  output: string;
  /** What the agent is asked for this one image. */
  request: string;
}

export function isImageFile(path: string): boolean {
  return IMAGE_EXTENSIONS.includes(extname(path).toLowerCase());
}

/** One job per image: same instructions, each result saved under the input's name in the output folder. */
export function batchJobs(inputs: string[], outDir: string, format: BatchFormat, message: string): BatchJob[] {
  const taken = new Map<string, number>();
  return inputs.map((input) => {
    const output = join(outDir, `${uniqueStem(stemOf(input), taken)}.${format}`);
    return { input, output, request: batchRequest(input, message) };
  });
}

function batchRequest(input: string, message: string): string {
  return `Input image: ${input}\n\n${message}\n\n(The result is saved automatically when you finish; don't call export_image.)`;
}

function stemOf(path: string): string {
  return basename(path, extname(path));
}

/** "a.jpg" and "a.png" would both become "a.png": number the repeats. */
function uniqueStem(stem: string, taken: Map<string, number>): string {
  const seen = taken.get(stem) ?? 0;
  taken.set(stem, seen + 1);
  return seen === 0 ? stem : `${stem}-${seen + 1}`;
}
