import type { AgentEvent } from '../domain/agent-events';
import type { AgentSettings, AgentSettingsUpdate } from '../domain/agent-providers';
import { splitSseEvents } from '../domain/split-sse-events';

export async function fetchAgentSettings(): Promise<AgentSettings> {
  return json(await fetch('/api/agent/settings'));
}

export async function saveAgentSettings(update: AgentSettingsUpdate): Promise<AgentSettings> {
  return json(
    await fetch('/api/agent/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    }),
  );
}

/** Sends a request to the built-in agent and reports each step as it streams in. Aborting stops the agent. */
export async function streamAgentChat(message: string, onEvent: (event: AgentEvent) => void, signal: AbortSignal) {
  const response = await fetch('/api/agent/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  });
  if (!response.ok || !response.body) await json(response);
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) return;
    const { events, rest } = splitSseEvents(buffer + value);
    buffer = rest;
    events.forEach((event) => onEvent(event as AgentEvent));
  }
}

export async function resetAgent(): Promise<void> {
  await fetch('/api/agent/reset', { method: 'POST' });
}

async function json<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body as T;
}
