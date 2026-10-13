import { agentApiFor } from '../../domain/agent/agent-api.js';
import type { AgentSettings } from '../../domain/agent/agent-settings.js';
import type { ChatClient } from './chat-client.js';
import { createOpenAiCompatibleClient } from './openai-compatible-client.js';
import { createOpenAiResponsesClient } from './openai-responses-client.js';

export function createChatClient(settings: AgentSettings): ChatClient {
  return agentApiFor(settings.baseURL) === 'responses'
    ? createOpenAiResponsesClient(settings)
    : createOpenAiCompatibleClient(settings);
}
