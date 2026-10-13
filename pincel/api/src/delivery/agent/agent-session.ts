import { missingSettings } from '../../domain/agent/agent-settings.js';
import type { ChatMessage } from '../../domain/agent/chat-message.js';
import type { AgentSettingsStore } from '../../data/agent-settings-store.js';
import { createChatClient } from '../../data/llm/create-chat-client.js';
import { TOOLS } from '../tools/tool-catalog.js';
import type { ToolServices } from '../tools/tool-definition.js';
import { AGENT_SYSTEM_PROMPT } from './agent-system-prompt.js';
import { toFunctionTools } from './agent-tools.js';
import { type AgentEvent, runAgentTurn } from './run-agent-turn.js';

const MAX_STEPS = 40;
const IMAGES_TO_KEEP = 2;
const START: ChatMessage[] = [{ role: 'system', content: AGENT_SYSTEM_PROMPT }];

/** The one conversation the editor has with the built-in agent. One turn runs at a time. */
export class AgentSession {
  private history = START;
  private running?: AbortController;
  private readonly tools = toFunctionTools(TOOLS);

  constructor(
    private readonly services: ToolServices,
    private readonly settings: AgentSettingsStore,
  ) {}

  get busy(): boolean {
    return this.running !== undefined;
  }

  /** Why a turn can't start right now, if it can't. */
  async blocker(): Promise<string | undefined> {
    if (this.busy) return 'The agent is still working on the previous request.';
    return missingSettings(await this.settings.load());
  }

  async send(text: string, onEvent: (event: AgentEvent) => void): Promise<void> {
    const controller = new AbortController();
    this.running = controller;
    try {
      this.history = await runAgentTurn({
        client: createChatClient(await this.settings.load()),
        tools: this.tools,
        services: this.services,
        history: [...this.history, { role: 'user', content: text }],
        maxSteps: MAX_STEPS,
        imagesToKeep: IMAGES_TO_KEEP,
        signal: controller.signal,
        onEvent,
      });
    } finally {
      // A failed or stopped turn leaves the history as it was, so the next request starts clean.
      this.running = undefined;
    }
  }

  stop(): void {
    this.running?.abort();
  }

  reset(): void {
    this.stop();
    this.history = START;
  }
}
