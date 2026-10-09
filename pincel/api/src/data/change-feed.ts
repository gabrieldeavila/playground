export interface ChangeEvent {
  version: number;
  /** Short human-readable description, e.g. "draw_rect (mcp)". */
  reason: string;
}

type Listener = (event: ChangeEvent) => void;

export function createChangeFeed() {
  const listeners = new Set<Listener>();
  return {
    subscribe(listener: Listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(event: ChangeEvent): void {
      for (const listener of listeners) listener(event);
    },
  };
}

export type ChangeFeed = ReturnType<typeof createChangeFeed>;
