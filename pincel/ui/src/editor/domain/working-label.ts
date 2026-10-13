import type { ChatEntry } from './agent-events';

/** What the agent is doing right now, for the spinner under the transcript. */
export function workingLabel(entries: ChatEntry[]): string {
  const last = entries.at(-1);
  if (last?.kind === 'tool' && last.status === 'writing') return `Writing ${last.name}…`;
  if (last?.kind === 'tool' && last.status === 'running') return `Running ${last.name}…`;
  if (last?.kind === 'draft') return 'Writing…';
  return 'Thinking…';
}
