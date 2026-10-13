import type { AgentEvent, ChatEntry, ToolEntry } from './agent-events';

/** Folds one streamed event into the transcript. */
export function applyAgentEvent(entries: ChatEntry[], event: AgentEvent): ChatEntry[] {
  switch (event.type) {
    case 'reasoning-delta':
      return appendText(entries, 'reasoning', event.text);
    case 'text-delta':
      return appendText(entries, 'draft', event.text);
    case 'tool-writing':
      return [...entries, { kind: 'tool', name: event.name, arguments: '', status: 'writing' }];
    case 'thinking':
      return finishDraft(entries, { kind: 'thinking', text: event.text });
    case 'tool-call':
      return startStep(entries, event.name, event.arguments);
    case 'tool-result':
      return updateLastStep(entries, event.name, 'running', { status: event.isError ? 'error' : 'done', result: event.text });
    case 'reply':
      return finishDraft(entries, { kind: 'reply', text: event.text, stoppedAtLimit: event.stoppedAtLimit });
    case 'error':
      return [...entries, { kind: 'error', text: event.text }];
  }
}

/** When a run ends early: unfinished steps are marked stopped, streamed text is kept. */
export function settleRunningSteps(entries: ChatEntry[]): ChatEntry[] {
  return entries.map((entry): ChatEntry => {
    if (entry.kind === 'draft') return { kind: 'thinking', text: entry.text };
    if (entry.kind === 'tool' && (entry.status === 'running' || entry.status === 'writing')) {
      return { ...entry, status: 'error', result: 'Stopped' };
    }
    return entry;
  });
}

/** Deltas extend the last entry while it is of the same kind. */
function appendText(entries: ChatEntry[], kind: 'reasoning' | 'draft', text: string): ChatEntry[] {
  const last = entries.at(-1);
  if (last?.kind === kind) return entries.with(-1, { kind, text: last.text + text });
  return [...entries, { kind, text }];
}

/** The final text replaces its streamed draft in place (it may sit before the tool steps). */
function finishDraft(entries: ChatEntry[], final: ChatEntry): ChatEntry[] {
  const index = entries.findLastIndex((entry) => entry.kind === 'draft');
  if (index >= 0) return entries.with(index, final);
  const hasText = 'text' in final && final.text;
  return hasText || final.kind === 'reply' ? [...entries, final] : entries;
}

function startStep(entries: ChatEntry[], name: string, args: string): ChatEntry[] {
  const updated = updateLastStep(entries, name, 'writing', { status: 'running', arguments: args });
  if (updated !== entries) return updated;
  return [...entries, { kind: 'tool', name, arguments: args, status: 'running' }];
}

function updateLastStep(entries: ChatEntry[], name: string, from: ToolEntry['status'], patch: Partial<ToolEntry>): ChatEntry[] {
  const index = entries.findLastIndex((entry) => entry.kind === 'tool' && entry.status === from && entry.name === name);
  if (index < 0) return entries;
  return entries.with(index, { ...(entries[index] as ToolEntry), ...patch });
}
