import type { StreamedEvent } from './pincel-client.js';

/** One line per agent step, for the terminal. */
export function printAgentEvent(event: StreamedEvent): void {
  if (event.type === 'thinking') console.log(`💭 ${event.text}`);
  if (event.type === 'tool-call') console.log(`🔧 ${event.name} ${truncate(String(event.arguments))}`);
  if (event.type === 'tool-result') console.log(`   ${event.isError ? '❌' : '✓'} ${truncate(String(event.text))}`);
  if (event.type === 'reply') console.log(`\n${event.text}${event.stoppedAtLimit ? '\n(stopped at the step limit)' : ''}`);
  if (event.type === 'error') console.error(`\nError: ${event.text}`);
}

/** Why a finished turn didn't do its job, if it didn't. */
export function turnProblem(events: StreamedEvent[]): string | undefined {
  const error = events.find((event) => event.type === 'error');
  if (error) return String(error.text);
  if (events.some((event) => event.type === 'reply' && event.stoppedAtLimit)) return 'stopped at the step limit';
  if (!events.some((event) => event.type === 'reply')) return 'the agent did not answer';
}

function truncate(text: string, max = 160): string {
  const line = text.replace(/\s+/g, ' ');
  return line.length > max ? `${line.slice(0, max)}…` : line;
}
