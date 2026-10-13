import OpenAI from 'openai';
import type { ResponseCreateParamsNonStreaming, ResponseInputItem } from 'openai/resources/responses/responses';
import type { AgentSettings } from '../../domain/agent/agent-settings.js';
import type { ToolCall } from '../../domain/agent/chat-message.js';
import { toResponsesInput, toResponsesTools } from '../../domain/agent/to-responses-input.js';
import type { ChatClient } from './chat-client.js';

type ReasoningEffort = NonNullable<ResponseCreateParamsNonStreaming['reasoning']>['effort'];

/**
 * OpenAI's Responses API, where reasoning models can call tools. Nothing is stored on
 * OpenAI's side: the encrypted reasoning comes back with each turn and is replayed next call.
 */
export function createOpenAiResponsesClient(settings: AgentSettings): ChatClient {
  const client = new OpenAI({ baseURL: settings.baseURL, apiKey: settings.apiKey });
  return {
    async complete(messages, tools, signal) {
      const { instructions, input } = toResponsesInput(messages);
      const response = await client.responses.create(
        {
          model: settings.model,
          instructions,
          input: input as ResponseInputItem[],
          tools: toResponsesTools(tools),
          store: false,
          include: ['reasoning.encrypted_content'],
          ...(settings.reasoningEffort && { reasoning: { effort: settings.reasoningEffort as ReasoningEffort } }),
        },
        { signal },
      );
      if (response.error) throw new Error(response.error.message);
      const toolCalls: ToolCall[] = response.output.flatMap((item) =>
        item.type === 'function_call'
          ? [{ id: item.call_id, type: 'function', function: { name: item.name, arguments: item.arguments } }]
          : [],
      );
      return {
        role: 'assistant',
        content: response.output_text || null,
        ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
        providerOutput: response.output,
      };
    },
  };
}
