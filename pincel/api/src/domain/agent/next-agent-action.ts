import type { ChatMessage, ToolCall } from './chat-message.js';

export type AgentAction =
  | { kind: 'run-tools'; calls: ToolCall[] }
  | { kind: 'done'; text: string }
  | { kind: 'step-limit'; text: string };

type AssistantMessage = Extract<ChatMessage, { role: 'assistant' }>;

/** What the loop does after the model answers: run the tools it asked for, or stop. */
export function nextAgentAction(reply: AssistantMessage, step: number, maxSteps: number): AgentAction {
  const text = reply.content ?? '';
  const calls = reply.tool_calls ?? [];
  if (calls.length === 0) return { kind: 'done', text };
  if (step >= maxSteps) return { kind: 'step-limit', text };
  return { kind: 'run-tools', calls };
}
