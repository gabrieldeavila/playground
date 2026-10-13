import { useState } from 'react';
import { LuSend, LuSquare } from 'react-icons/lu';

interface Props {
  busy: boolean;
  disabled: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}

/** Where the request is typed. Enter sends, Shift+Enter breaks the line; while working it becomes a stop button. */
export function AgentInput({ busy, disabled, onSend, onStop }: Props) {
  const [text, setText] = useState('');
  const submit = () => {
    if (!text.trim() || busy || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex items-end gap-2 border-t border-edge p-2">
      <textarea
        value={text}
        rows={2}
        placeholder={disabled ? 'Set up a model first' : 'Make a retro poster that says SYNTHWAVE…'}
        disabled={disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        className="min-h-0 flex-1 resize-none rounded-md border border-edge bg-panel-2 px-2 py-1.5 outline-none focus:border-accent"
      />
      {busy ? (
        <button type="button" title="Stop" onClick={onStop} className="grid size-8 place-items-center rounded-md bg-red-500/80 text-white">
          <LuSquare />
        </button>
      ) : (
        <button
          type="button"
          title="Send (Enter)"
          disabled={!text.trim() || disabled}
          onClick={submit}
          className="grid size-8 place-items-center rounded-md bg-accent text-white disabled:opacity-35"
        >
          <LuSend />
        </button>
      )}
    </div>
  );
}
