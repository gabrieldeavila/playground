import { basename } from 'node:path';
import { findImageFiles } from '../../data/find-image-files.js';
import { localPath } from '../../data/local-path.js';
import { type BatchFormat, type BatchJob, batchJobs } from '../../domain/batch/batch-jobs.js';
import { pincel, type StreamedEvent } from './pincel-client.js';
import { printAgentEvent, turnProblem } from './print-agent-event.js';

export interface BatchOptions {
  patterns: string[];
  outDir: string;
  format: BatchFormat;
  preset?: string;
  message: string;
}

/** Runs the same request on each image, each in a fresh conversation, and saves every result. */
export async function runBatch(options: BatchOptions): Promise<void> {
  const inputs = [...new Set((await Promise.all(options.patterns.map(findImageFiles))).flat())];
  if (inputs.length === 0) throw new Error(`No images found in ${options.patterns.join(', ')}`);
  const jobs = batchJobs(inputs, localPath(options.outDir), options.format, options.message);
  const failed: string[] = [];
  for (const [index, job] of jobs.entries()) {
    console.log(`\n━━ [${index + 1}/${jobs.length}] ${basename(job.input)}`);
    const problem = await runJob(job, options.preset).catch((error: Error) => error.message);
    if (problem) failed.push(`${basename(job.input)}: ${problem}`);
  }
  console.log(`\nDone: ${jobs.length - failed.length}/${jobs.length} saved to ${localPath(options.outDir)}`);
  if (failed.length) {
    console.error(`Failed:\n${failed.map((line) => `  ${line}`).join('\n')}`);
    process.exitCode = 1;
  }
}

/** Returns why the job failed, or nothing when its result was saved. */
async function runJob(job: BatchJob, preset: string | undefined): Promise<string | undefined> {
  await pincel.reset();
  const events: StreamedEvent[] = [];
  await pincel.chat(job.request, preset, (event) => {
    events.push(event);
    printAgentEvent(event);
  });
  const problem = turnProblem(events);
  if (problem) return problem;
  const saved = await pincel.runTool('export_image', { path: job.output, overwrite: true });
  console.log(`💾 ${saved.text}`);
}
