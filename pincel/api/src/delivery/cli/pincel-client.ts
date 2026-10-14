const API = process.env.PINCEL_API ?? 'http://localhost:4300';

export interface StreamedEvent {
  type: string;
  [key: string]: unknown;
}

export interface SettingsUpdate {
  apiKey?: string;
  model?: string;
  baseURL?: string;
  reasoningEffort?: string;
}

/** The running Pincel API (`pnpm dev`), as the CLI uses it. */
export const pincel = {
  async saveSettings(update: SettingsUpdate): Promise<unknown> {
    return (await call('PUT', '/api/agent/settings', update)).json();
  },

  async reset(): Promise<void> {
    await call('POST', '/api/agent/reset');
  },

  /** Sends a request to the built-in agent and hands over each step as it streams in. */
  async chat(message: string, preset: string | undefined, onEvent: (event: StreamedEvent) => void): Promise<void> {
    const response = await call('POST', '/api/agent/chat', { message, preset });
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const chunk of response.body!) {
      buffer += decoder.decode(chunk, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) onEvent(JSON.parse(event.replace(/^data: /, '')));
    }
  },

  async runTool(name: string, input: unknown): Promise<{ text: string }> {
    return (await call('POST', `/api/tools/${name}`, input)).json();
  },
};

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
