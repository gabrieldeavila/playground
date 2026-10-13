import { parseArgs } from 'node:util';

/**
 * Talks to the built-in agent of a running Pincel API (`pnpm dev`):
 *   pnpm agent --key sk-... --model gpt-4.1        save settings
 *   pnpm agent --reasoning none                    send reasoning_effort ("" to stop sending it)
 *   pnpm agent "make a retro sunset poster"        send a request
 *   pnpm agent --reset "start over with ..."       forget the conversation first
 */
const API = process.env.PINCEL_API ?? 'http://localhost:4300';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    key: { type: 'string' },
    model: { type: 'string' },
    'base-url': { type: 'string' },
    reasoning: { type: 'string' },
    reset: { type: 'boolean', default: false },
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
    const settings = await call('PUT', '/api/agent/settings', {
      apiKey: values.key,
      model: values.model,
      baseURL: values['base-url'],
      reasoningEffort: values.reasoning,
    });
    console.log('Settings saved:', await settings.json());
  }
  if (values.reset) await call('POST', '/api/agent/reset');
  const message = positionals.join(' ').trim();
  if (message) await chat(message);
}

async function chat(text: string) {
  const response = await call('POST', '/api/agent/chat', { message: text });
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of response.body!) {
    buffer += decoder.decode(chunk, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const event of events) printEvent(JSON.parse(event.replace(/^data: /, '')));
  }
}

function printEvent(event: { type: string; [key: string]: unknown }) {
  if (event.type === 'thinking') console.log(`💭 ${event.text}`);
  if (event.type === 'tool-call') console.log(`🔧 ${event.name} ${truncate(String(event.arguments))}`);
  if (event.type === 'tool-result') console.log(`   ${event.isError ? '❌' : '✓'} ${truncate(String(event.text))}`);
  if (event.type === 'reply') console.log(`\n${event.text}${event.stoppedAtLimit ? '\n(stopped at the step limit)' : ''}`);
  if (event.type === 'error') console.error(`\nError: ${event.text}`);
}

async function call(method: string, path: string, body?: unknown): Promise<Response> {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => {
    throw new Error(`Pincel API isn't running at ${API}. Start it with "pnpm dev".`);
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? response.statusText);
  return response;
}

function truncate(text: string, max = 160): string {
  const line = text.replace(/\s+/g, ' ');
  return line.length > max ? `${line.slice(0, max)}…` : line;
}
