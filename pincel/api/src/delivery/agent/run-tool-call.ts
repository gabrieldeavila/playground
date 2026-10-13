import type { ToolCall } from '../../domain/agent/chat-message.js';
import type { ToolCallResult } from '../../domain/agent/tool-results-to-messages.js';
import { findTool } from '../tools/tool-catalog.js';
import { describeError, runTool } from '../tools/run-tool.js';
import type { ToolServices } from '../tools/tool-definition.js';

export interface RanToolCall extends ToolCallResult {
  isError: boolean;
}

/** Runs one tool the model asked for. Errors go back to the model as text so it can fix the call. */
export async function runToolCall(call: ToolCall, services: ToolServices): Promise<RanToolCall> {
  const base = { callId: call.id, toolName: call.function.name };
  const tool = findTool(call.function.name);
  if (!tool) return { ...base, text: `Error: unknown tool "${call.function.name}"`, isError: true };
  try {
    const input = JSON.parse(call.function.arguments || '{}');
    const result = await runTool(tool, input, { ...services, source: 'agent' });
    return { ...base, text: result.text, imagePng: result.image?.toString('base64'), isError: false };
  } catch (error) {
    return { ...base, text: `Error: ${describeError(error)}`, isError: true };
  }
}
