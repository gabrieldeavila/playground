import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { type AgentSettings, DEFAULT_AGENT_SETTINGS } from '../domain/agent/agent-settings.js';

export interface AgentSettingsStore {
  load(): Promise<AgentSettings>;
  save(settings: AgentSettings): Promise<void>;
}

/** Settings (with the API key) live in a local JSON file only the owner can read. */
export function createAgentSettingsStore(filePath: string): AgentSettingsStore {
  return {
    async load() {
      try {
        const saved = JSON.parse(await readFile(filePath, 'utf8')) as Partial<AgentSettings>;
        return { ...DEFAULT_AGENT_SETTINGS, ...saved };
      } catch {
        return DEFAULT_AGENT_SETTINGS;
      }
    },
    async save(settings) {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, JSON.stringify(settings, null, 2), { mode: 0o600 });
    },
  };
}
