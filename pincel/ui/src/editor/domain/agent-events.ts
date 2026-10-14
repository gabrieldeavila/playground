/** Mirrors the events POST /api/agent/chat streams. */
export type AgentEvent =
  | { type: 'reasoning-delta'; text: string }
  | { type: 'text-delta'; text: string }
  | { type: 'tool-writing'; name: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool-call'; name: string; arguments: string }
  | { type: 'tool-result'; name: string; text: string; isError: boolean }
  | { type: 'reply'; text: string; stoppedAtLimit: boolean }
  | { type: 'error'; text: string };

/** writing = the model is still producing the call; running = Pincel is executing it. */
export type ToolStepStatus = 'writing' | 'running' | 'done' | 'error';

/** One line in the chat panel. */
export type ChatEntry =
  | { kind: 'user'; text: string; preset?: string }
  | { kind: 'reasoning'; text: string }
  /** Text still streaming in; becomes `thinking` or `reply` once the model finishes. */
  | { kind: 'draft'; text: string }
  | { kind: 'thinking'; text: string }
  | { kind: 'tool'; name: string; arguments: string; status: ToolStepStatus; result?: string }
  | { kind: 'reply'; text: string; stoppedAtLimit: boolean }
  | { kind: 'error'; text: string };

export type ToolEntry = Extract<ChatEntry, { kind: 'tool' }>;
