import { defineTool } from './tool-definition.js';

export const historyTools = [
  defineTool({
    name: 'undo',
    title: 'Undo',
    description: 'Reverts the most recent edit (by anyone).',
    input: {},
    async run(_, { engine }) {
      return { text: (await engine.undo()) ? 'Undone' : 'Nothing to undo' };
    },
  }),

  defineTool({
    name: 'redo',
    title: 'Redo',
    description: 'Re-applies the last undone edit.',
    input: {},
    async run(_, { engine }) {
      return { text: (await engine.redo()) ? 'Redone' : 'Nothing to redo' };
    },
  }),
];
