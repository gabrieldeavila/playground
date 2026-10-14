import { parseArgs } from 'node:util';
import { BATCH_FORMATS, type BatchFormat } from './domain/batch/batch-jobs.js';
import { pincel } from './delivery/cli/pincel-client.js';
import { printAgentEvent } from './delivery/cli/print-agent-event.js';
import { runBatch } from './delivery/cli/run-batch.js';

/**
 * Talks to the built-in agent of a running Pincel API (`pnpm dev`):
 *   pnpm agent --key sk-... --model gpt-4.1        save settings
 *   pnpm agent --reasoning none                    send reasoning_effort ("" to stop sending it)
 *   pnpm agent "make a retro sunset poster"        send a request
 *   pnpm agent --reset "start over with ..."       forget the conversation first
 *   pnpm agent --preset promo-post "~/shoe.jpg, R$ 199"
 *   pnpm agent --each ~/fotos --out ~/saida "remove the white background"
 *     (--each takes a folder or a quoted glob like "~/fotos/*.jpg", and can repeat;
 *      each image gets a fresh conversation and its result is saved as --format, png by default)
 */
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    key: { type: 'string' },
    model: { type: 'string' },
    'base-url': { type: 'string' },
    reasoning: { type: 'string' },
    reset: { type: 'boolean', default: false },
    preset: { type: 'string' },
    each: { type: 'string', multiple: true },
    out: { type: 'string' },
    format: { type: 'string', default: 'png' },
  },
});

try {
  await run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

async function run() {
  if (values.key || values.model || values['base-url'] || values.reasoning !== undefined) {
    const settings = await pincel.saveSettings({
      apiKey: values.key,
      model: values.model,
      baseURL: values['base-url'],
      reasoningEffort: values.reasoning,
    });
    console.log('Settings saved:', settings);
  }
  const message = positionals.join(' ').trim();
  if (values.each) {
    const { each: patterns, preset } = values;
    return runBatch({ patterns, outDir: requiredOut(), format: batchFormat(), preset, message: requiredMessage(message) });
  }
  if (values.reset) await pincel.reset();
  if (message) await pincel.chat(message, values.preset, printAgentEvent);
}

function requiredOut(): string {
  if (!values.out) throw new Error('--each needs --out <folder> for the results');
  return values.out;
}

function batchFormat(): BatchFormat {
  if (!BATCH_FORMATS.includes(values.format as BatchFormat)) throw new Error(`--format must be one of ${BATCH_FORMATS.join(', ')}`);
  return values.format as BatchFormat;
}

function requiredMessage(message: string): string {
  if (!message && !values.preset) throw new Error('Say what to do with each image (or pass --preset)');
  return message || 'Make the piece with this image.';
}
