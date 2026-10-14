import type { Command } from '../domain/commands/command-types.js';
import type { DocumentSetup } from '../domain/document/types.js';
import type { DocumentEngine } from './document-engine.js';
import type { CommandSource } from './logged-command.js';

/** A document kept to start new ones from: its setup and every edit that built it. */
export interface DocumentTemplate {
  setup: DocumentSetup;
  commands: Command[];
}

/** The open document as a template (only applied edits; undone ones are left out). */
export function templateOf(engine: DocumentEngine): DocumentTemplate {
  return { setup: engine.documentSetup, commands: engine.log.flatMap((entry) => entry.commands) };
}

/** Starts a new document from a template, rebuilt as one undo step. */
export async function loadTemplate(engine: DocumentEngine, template: DocumentTemplate, label: string, source: CommandSource) {
  await engine.reset(template.setup, source);
  await engine.group(label, source, async () => {
    for (const command of template.commands) await engine.execute(command, source);
  });
}
