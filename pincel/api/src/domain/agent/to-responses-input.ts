import type { ChatMessage, ContentPart, FunctionTool } from './chat-message.js';

/** The subset of Responses API input items the agent sends. */
export type ResponsesInputItem =
  | { role: 'user' | 'assistant'; content: string | ResponsesContentPart[] }
  | { type: 'function_call'; call_id: string; name: string; arguments: string }
  | { type: 'function_call_output'; call_id: string; output: string }
  | Record<string, unknown>;

export type ResponsesContentPart =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail: 'auto' };

export interface ResponsesRequestParts {
  instructions: string;
  input: ResponsesInputItem[];
}

/** Chat history → Responses API `instructions` + `input`. */
export function toResponsesInput(messages: ChatMessage[]): ResponsesRequestParts {
  const instructions = messages.flatMap((message) => (message.role === 'system' ? [message.content] : [])).join('\n\n');
  return { instructions, input: messages.flatMap(toInputItems) };
}

export function toResponsesTools(tools: FunctionTool[]) {
  return tools.map(({ function: fn }) => ({
    type: 'function' as const,
    name: fn.name,
    description: fn.description,
    parameters: fn.parameters,
    strict: false,
  }));
}

function toInputItems(message: ChatMessage): ResponsesInputItem[] {
  switch (message.role) {
    case 'system':
      return [];
    case 'user':
      return [{ role: 'user', content: typeof message.content === 'string' ? message.content : message.content.map(toInputPart) }];
    case 'tool':
      return [{ type: 'function_call_output', call_id: message.tool_call_id, output: message.content }];
    case 'assistant':
      return assistantItems(message);
  }
}

/** Replays what the Responses API returned when we have it (keeps reasoning paired with its calls). */
function assistantItems(message: Extract<ChatMessage, { role: 'assistant' }>): ResponsesInputItem[] {
  if (message.providerOutput) return message.providerOutput as ResponsesInputItem[];
  const text: ResponsesInputItem[] = message.content ? [{ role: 'assistant', content: message.content }] : [];
  const calls: ResponsesInputItem[] = (message.tool_calls ?? []).map((call) => ({
    type: 'function_call',
    call_id: call.id,
    name: call.function.name,
    arguments: call.function.arguments,
  }));
  return [...text, ...calls];
}

function toInputPart(part: ContentPart): ResponsesContentPart {
  return part.type === 'text'
    ? { type: 'input_text', text: part.text }
    : { type: 'input_image', image_url: part.image_url.url, detail: 'auto' };
}
