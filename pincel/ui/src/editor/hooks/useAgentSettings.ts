import { useEffect, useState } from 'react';
import { fetchAgentSettings, saveAgentSettings } from '../api/agent-api';
import type { AgentSettings, AgentSettingsUpdate } from '../domain/agent-providers';

/** Which provider and model the agent uses. The key goes in, only a hint comes back. */
export function useAgentSettings() {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAgentSettings().then(setSettings, (e: Error) => setError(e.message));
  }, []);

  const save = async (update: AgentSettingsUpdate): Promise<boolean> => {
    try {
      setSettings(await saveAgentSettings(update));
      setError('');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  return { settings, error, save };
}
