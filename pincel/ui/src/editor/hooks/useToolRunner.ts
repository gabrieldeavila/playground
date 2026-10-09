import { useCallback, useState } from 'react';
import { callTool, type ToolResponse } from '../api/pincel-api';
import type { ToolCall } from '../domain/types';

/** Sends tool calls to the API and keeps the last error for the status bar. */
export function useToolRunner() {
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (call: ToolCall): Promise<ToolResponse | null> => {
    try {
      const result = await callTool(call);
      setError(null);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, []);

  return { run, error, clearError: () => setError(null), showError: setError };
}
