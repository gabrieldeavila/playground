import { glob, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { isImageFile } from '../domain/batch/batch-jobs.js';
import { localPath } from './local-path.js';

/** The images a batch should process: every image in a folder, or the files matching a glob ("~/fotos/*.jpg"). */
export async function findImageFiles(pattern: string): Promise<string[]> {
  const path = localPath(pattern);
  const isFolder = await stat(path).then((info) => info.isDirectory(), () => false);
  const files = isFolder ? (await readdir(path)).map((name) => join(path, name)) : await matching(path);
  return files.filter(isImageFile).sort();
}

async function matching(pattern: string): Promise<string[]> {
  const files: string[] = [];
  for await (const file of glob(pattern)) files.push(file);
  return files;
}
