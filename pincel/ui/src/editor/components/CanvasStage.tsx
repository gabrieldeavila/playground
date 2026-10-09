import type { PointerEvent, ReactNode, RefObject } from 'react';
import { renderUrl, selectionOverlayUrl } from '../api/pincel-api';
import type { DocumentSnapshot } from '../domain/types';

interface Props {
  doc: DocumentSnapshot;
  zoom: number;
  containerRef: RefObject<HTMLDivElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  handlers: {
    onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: () => void;
  };
  onRendered: () => void;
  cursor: string;
  children?: ReactNode;
}

/** The server-rendered image with a same-size overlay canvas for live gesture previews. */
export function CanvasStage({ doc, zoom, containerRef, overlayRef, handlers, onRendered, cursor, children }: Props) {
  return (
    <div ref={containerRef} className="grid min-w-0 flex-1 place-items-center overflow-auto bg-workspace">
      <div className="checkerboard relative shadow-2xl shadow-black/60" style={{ width: doc.width * zoom, height: doc.height * zoom }}>
        <img
          src={renderUrl(doc.version)}
          alt="Canvas"
          draggable={false}
          onLoad={onRendered}
          className="absolute inset-0 size-full select-none"
        />
        {doc.selection && (
          <img
            src={selectionOverlayUrl(doc.version, Math.round(Math.max(doc.width, doc.height) * zoom))}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full select-none"
          />
        )}
        <canvas
          ref={overlayRef}
          width={doc.width}
          height={doc.height}
          className="absolute inset-0 size-full touch-none"
          style={{ cursor }}
          {...handlers}
          onPointerLeave={handlers.onPointerUp}
        />
        {children}
      </div>
    </div>
  );
}
