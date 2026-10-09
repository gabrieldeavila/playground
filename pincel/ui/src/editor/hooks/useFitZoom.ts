import { useEffect, useRef, useState } from 'react';
import { fitZoom } from '../domain/canvas-coords';

/** Zoom that fits the document into its container, recomputed when either changes size. */
export function useFitZoom(doc: { width: number; height: number } | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !doc) return;
    const update = () => setZoom(fitZoom(doc, { width: el.clientWidth, height: el.clientHeight }));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [doc?.width, doc?.height]);

  return { containerRef, zoom };
}
