import OpenAI from 'openai';
import type { Response, ResponseCreateParamsStreaming, ResponseInputItem } from 'openai/resources/responses/responses';
import type { AgentSettings } from '../../domain/agent/agent-settings.js';
import type { ToolCall } from '../../domain/agent/chat-message.js';
import { responsesStreamProgress } from '../../domain/agent/responses-stream-progress.js';
import { toResponsesInput, toResponsesTools } from '../../domain/agent/to-responses-input.js';
import type { AssistantMessage, ChatClient, CompleteOptions } from './chat-client.js';

type ReasoningEffort = NonNullable<ResponseCreateParamsStreaming['reasoning']>['effort'];

/** Models that refused reasoning summaries (not a reasoning model, or the org isn't verified). */
const noSummaryModels = new Set<string>();

/**
 * OpenAI's Responses API, where reasoning models can call tools. Streams so the editor can show
 * the reasoning and each tool as it is written. Nothing is stored on OpenAI's side: the encrypted
 * reasoning comes back with each turn and is replayed next call.
 */
export function createOpenAiResponsesClient(settings: AgentSettings): ChatClient {
  const client = new OpenAI({ baseURL: settings.baseURL, apiKey: settings.apiKey });

  const run = async (params: ResponseCreateParamsStreaming, { signal, onProgress }: CompleteOptions) => {
    const stream = await client.responses.create(params, { signal });
    let final: Response | undefined;
    for await (const event of stream) {
      const progress = responsesStreamProgress(event);
      if (progress) onProgress?.(progress);
      if (event.type === 'response.completed' || event.type === 'response.incomplete') final = event.response;
      if (event.type === 'response.failed') throw new Error(event.response.error?.message ?? 'The model failed.');
      if (event.type === 'error') throw new Error(event.message);
    }
    if (!final) throw new Error('The model stream ended without a response.');
    return final;
  };

  return {
    async complete(messages, tools, options = {}) {
      const { instructions, input } = toResponsesInput(messages);
      const params = (summary: boolean): ResponseCreateParamsStreaming => ({
        model: settings.model,
        instructions,
        input: input as ResponseInputItem[],
        tools: toResponsesTools(tools),
        store: false,
        stream: true,
        include: ['reasoning.encrypted_content'],
        ...reasoningParams(settings.reasoningEffort, summary),
      });
      const wantsSummary = !noSummaryModels.has(settings.model);
      try {
        return toAssistantMessage(await run(params(wantsSummary), options));
      } catch (error) {
        if (!wantsSummary || !refusedSummary(error)) throw error;
        noSummaryModels.add(settings.model);
        return toAssistantMessage(await run(params(false), options));
      }
    },
  };
}

/** Left out entirely when empty: non-reasoning models reject the field. */
function reasoningParams(effort: string, summary: boolean): Pick<ResponseCreateParamsStreaming, 'reasoning'> {
  if (!effort && !summary) return {};
  return {
    reasoning: {
      ...(effort && { effort: effort as ReasoningEffort }),
      ...(summary && { summary: 'auto' as const }),
    },
  };
}

function refusedSummary(error: unknown): boolean {
  return error instanceof OpenAI.BadRequestError && /summar|reasoning|verif/i.test(error.message);
}

function toAssistantMessage(response: Response): AssistantMessage {
  const toolCalls: ToolCall[] = response.output.flatMap((item) =>
    item.type === 'function_call'
      ? [{ id: item.call_id, type: 'function', function: { name: item.name, arguments: item.arguments } }]
      : [],
  );
  return {
    role: 'assistant',
    content: outputText(response) || null,
    ...(toolCalls.length > 0 && { tool_calls: toolCalls }),
    providerOutput: response.output,
  };
}

/** Streamed responses don't carry the SDK's `output_text` shortcut. */
function outputText(response: Response): string {
  return response.output
    .flatMap((item) => (item.type === 'message' ? item.content : []))
    .flatMap((part) => (part.type === 'output_text' ? [part.text] : []))
    .join('');
}
