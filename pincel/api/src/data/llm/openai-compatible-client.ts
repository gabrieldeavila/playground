import OpenAI from 'openai';
import type { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { AgentSettings } from '../../domain/agent/agent-settings.js';
import type { ToolCall } from '../../domain/agent/chat-message.js';
import { stripProviderOutput } from '../../domain/agent/strip-provider-output.js';
import type { ChatClient } from './chat-client.js';

/** Any chat-completions endpoint: Gemini, OpenRouter, Ollama, LM Studio. */
export function createOpenAiCompatibleClient(settings: AgentSettings): ChatClient {
  // Local servers ignore the key, but the SDK insists on one.
  const client = new OpenAI({ baseURL: settings.baseURL, apiKey: settings.apiKey || 'local' });
  return {
    async complete(messages, tools, signal) {
      const response = await client.chat.completions.create(
        {
          model: settings.model,
          messages: stripProviderOutput(messages) as ChatCompletionMessageParam[],
          tools,
          // Only when set: other providers may reject the field.
          ...(settings.reasoningEffort && {
            reasoning_effort: settings.reasoningEffort as ChatCompletionCreateParamsNonStreaming['reasoning_effort'],
          }),
        },
        { signal },
      );
      const message = response.choices[0]?.message;
      if (!message) throw new Error('The model sent an empty response.');
      const toolCalls: ToolCall[] = (message.tool_calls ?? []).flatMap((call) =>
        call.type === 'function' ? [{ id: call.id, type: 'function', function: call.function }] : [],
      );
      return { role: 'assistant', content: message.content, ...(toolCalls.length > 0 && { tool_calls: toolCalls }) };
    },
  };
}
