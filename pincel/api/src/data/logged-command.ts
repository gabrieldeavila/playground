import type { Command } from '../domain/commands/command-types.js';

/** Who asked for an edit: an AI through MCP, the REST API, or a person in the editor. */
export type CommandSource = 'mcp' | 'rest' | 'ui';

/** One undo step: usually a single command, several when they came in a batch. */
export interface LoggedCommand {
  label: string;
  commands: Command[];
  source: CommandSource;
  at: string;
}

/** Older saves stored one `command` per entry. */
export function normalizeLoggedCommand(entry: LoggedCommand | (Omit<LoggedCommand, 'label' | 'commands'> & { command: Command })): LoggedCommand {
  if ('commands' in entry) return entry;
  const { command, ...rest } = entry;
  return { ...rest, label: command.type, commands: [command] };
}
