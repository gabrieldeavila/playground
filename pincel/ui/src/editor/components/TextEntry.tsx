import { useState } from 'react';
import type { Point } from '../domain/types';

interface Props {
  at: Point;
  zoom: number;
  fontSize: number;
  color: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

/** Inline input shown where the text tool was clicked. Enter commits, Esc cancels. */
export function TextEntry({ at, zoom, fontSize, color, onCommit, onCancel }: Props) {
  const [text, setText] = useState('');
  const finish = () => (text.trim() ? onCommit(text) : onCancel());

  return (
    <input
      autoFocus
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={finish}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish();
        if (e.key === 'Escape') onCancel();
      }}
      placeholder="Type, then Enter"
      className="absolute min-w-40 border border-dashed border-accent bg-transparent outline-none"
      style={{ left: at[0] * zoom, top: at[1] * zoom, fontSize: fontSize * zoom, color, lineHeight: 1 }}
    />
  );
}
