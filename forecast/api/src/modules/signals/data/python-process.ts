import { spawn } from 'node:child_process';
import { mlDirectory } from './json-signal-snapshot.repository.js';

export class PythonProcessError extends Error {
  constructor(
    message: string,
    readonly code: number | null,
  ) {
    super(message);
  }
}

/** Runs `uv run python <args>` in the ML project and resolves with its stdout. */
export function runPython(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('uv', ['run', 'python', ...args], {
      cwd: mlDirectory(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0
        ? resolve(Buffer.concat(stdout).toString('utf8'))
        : reject(
            new PythonProcessError(
              `${args.join(' ')} falhou (${code}): ${stderr}`,
              code,
            ),
          ),
    );
  });
}
