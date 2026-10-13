import type { ModelProgress } from './model-progress.js';

/** The fields of a Responses API stream event this module looks at. */
export interface ResponsesStreamEvent {
  type: string;
  delta?: unknown;
  item?: { type?: string; name?: string };
}

/** Turns a Responses API stream event into something worth showing, if it is. */
export function responsesStreamProgress(event: ResponsesStreamEvent): ModelProgress | undefined {
  if (event.type === 'response.reasoning_summary_text.delta' && typeof event.delta === 'string') {
    return { type: 'reasoning-delta', text: event.delta };
  }
  if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
    return { type: 'text-delta', text: event.delta };
  }
  if (event.type === 'response.output_item.added' && event.item?.type === 'function_call' && event.item.name) {
    return { type: 'tool-writing', name: event.item.name };
  }
  return undefined;
}
