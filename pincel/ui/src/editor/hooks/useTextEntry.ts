import { useCallback, useState } from 'react';
import type { Point } from '../domain/types';

/** Where the text tool was clicked, while the user is typing. */
export function useTextEntry() {
  const [at, setAt] = useState<Point | null>(null);
  const open = useCallback((point: Point) => setAt(point), []);
  const close = useCallback(() => setAt(null), []);
  return { at, open, close };
}
