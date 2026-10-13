import type { FunctionTool } from '../../domain/agent/chat-message.js';
import type { ToolDefinition } from '../tools/tool-definition.js';
import { toolJsonSchema } from '../tools/tool-json-schema.js';

/** Editor tools in the function-calling format OpenAI-compatible APIs expect. */
export function toFunctionTools(tools: ToolDefinition[]): FunctionTool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: { name: tool.name, description: tool.description, parameters: toolJsonSchema(tool) },
  }));
}
