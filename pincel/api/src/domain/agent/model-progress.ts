/** What a model is producing while it still works on its answer (streaming providers only). */
export type ModelProgress =
  | { type: 'reasoning-delta'; text: string }
  | { type: 'text-delta'; text: string }
  | { type: 'tool-writing'; name: string };
