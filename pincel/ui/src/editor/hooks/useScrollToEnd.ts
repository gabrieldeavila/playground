import { useEffect, useRef } from 'react';

/** Keeps a scrolling list pinned to its newest item whenever `trigger` changes. */
export function useScrollToEnd<T extends HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [trigger]);
  return ref;
}
