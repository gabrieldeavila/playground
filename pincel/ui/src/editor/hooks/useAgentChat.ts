import { useRef, useState } from 'react';
import { resetAgent, streamAgentChat } from '../api/agent-api';
import type { ChatEntry } from '../domain/agent-events';
import { applyAgentEvent, settleRunningSteps } from '../domain/apply-agent-event';

/** The chat with the built-in agent: sends requests, follows the streamed steps, stops on demand. */
export function useAgentChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const running = useRef<AbortController | null>(null);

  const send = async (text: string, preset?: string) => {
    const controller = new AbortController();
    running.current = controller;
    setBusy(true);
    setEntries((current) => [...current, { kind: 'user', text, preset }]);
    try {
      await streamAgentChat({ message: text, preset }, (event) => setEntries((current) => applyAgentEvent(current, event)), controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) setEntries((current) => [...current, { kind: 'error', text: messageOf(error) }]);
    } finally {
      setEntries(settleRunningSteps);
      running.current = null;
      setBusy(false);
    }
  };

  // Closing the stream is enough: the API stops the agent when the request goes away.
  const stop = () => running.current?.abort();

  const newChat = async () => {
    stop();
    await resetAgent();
    setEntries([]);
  };

  return { entries, busy, send, stop, newChat };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
