import { homedir } from 'node:os';
import { resolve } from 'node:path';

/** Absolute path for a path the user typed, with a leading ~ meaning their home folder. */
export function localPath(path: string): string {
  return resolve(path.replace(/^~(?=$|\/)/, homedir()));
}
