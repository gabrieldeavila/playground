import type { DocumentSetup } from '../document/types.js';
import type { PaintEnv } from '../paint/surface.js';
import { applyCommand } from './apply-command.js';
import type { Command } from './command-types.js';
import { createDocState, type DocState } from './doc-state.js';

/** Rebuilds the document from scratch: the setup plus every command, in order. */
export async function replay(setup: DocumentSetup, commands: Iterable<Command>, env: PaintEnv): Promise<DocState> {
  let state = createDocState(setup, env);
  for (const command of commands) state = await applyCommand(state, command, env);
  return state;
}
