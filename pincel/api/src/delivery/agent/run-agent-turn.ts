import type { ChatMessage, FunctionTool, ToolCall } from '../../domain/agent/chat-message.js';
import type { ModelProgress } from '../../domain/agent/model-progress.js';
import { closeDanglingCalls } from '../../domain/agent/close-dangling-calls.js';
import { dropOldImages } from '../../domain/agent/drop-old-images.js';
import { nextAgentAction } from '../../domain/agent/next-agent-action.js';
import { toolResultsToMessages } from '../../domain/agent/tool-results-to-messages.js';
import type { ChatClient } from '../../data/llm/chat-client.js';
import type { ToolServices } from '../tools/tool-definition.js';
import { runToolCall } from './run-tool-call.js';

export type AgentEvent =
  | ModelProgress
  | { type: 'thinking'; text: string }
  | { type: 'tool-call'; name: string; arguments: string }
  | { type: 'tool-result'; name: string; text: string; isError: boolean }
  | { type: 'reply'; text: string; stoppedAtLimit: boolean };

export interface AgentTurn {
  client: ChatClient;
  tools: FunctionTool[];
  services: ToolServices;
  /** Whole conversation so far, system prompt and the new user message included. */
  history: ChatMessage[];
  maxSteps: number;
  imagesToKeep: number;
  signal?: AbortSignal;
  onEvent(event: AgentEvent): void;
}

/** Talks to the model and runs its tools until it answers. Returns the updated history. */
export async function runAgentTurn(turn: AgentTurn): Promise<ChatMessage[]> {
  let history = turn.history;
  for (let step = 1; ; step += 1) {
    history = dropOldImages(history, turn.imagesToKeep);
    const reply = await turn.client.complete(history, turn.tools, { signal: turn.signal, onProgress: turn.onEvent });
    history = [...history, reply];
    const action = nextAgentAction(reply, step, turn.maxSteps);
    if (action.kind !== 'run-tools') {
      turn.onEvent({ type: 'reply', text: action.text, stoppedAtLimit: action.kind === 'step-limit' });
      return action.kind === 'step-limit' ? closeDanglingCalls(history) : history;
    }
    if (reply.content) turn.onEvent({ type: 'thinking', text: reply.content });
    history = [...history, ...toolResultsToMessages(await runCalls(turn, action.calls))];
  }
}

async function runCalls(turn: AgentTurn, calls: ToolCall[]) {
  const results = [];
  // One at a time: edits depend on each other's order.
  for (const call of calls) {
    turn.signal?.throwIfAborted();
    turn.onEvent({ type: 'tool-call', name: call.function.name, arguments: call.function.arguments });
    const result = await runToolCall(call, turn.services);
    turn.onEvent({ type: 'tool-result', name: result.toolName, text: result.text, isError: result.isError });
    results.push(result);
  }
  return results;
}
