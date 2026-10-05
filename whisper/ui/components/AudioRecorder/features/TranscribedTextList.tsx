import { memo, useEffect, useRef, useState } from "react";
import type { RecordingText } from "~types/interface/recording.interface";

interface TranscribedTextListProps {
  transcripts: RecordingText[];
  onUpdateText: (id: string, text: string) => Promise<void> | void;
}

const TranscribedTextList = memo(
  ({ transcripts, onUpdateText }: TranscribedTextListProps) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const editableRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const originalTextRef = useRef<Record<string, string>>({});
    const savingRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
      if (editingId === null) return;
      const node = editableRefs.current[editingId];
      if (!node) return;

      requestAnimationFrame(() => {
        node.focus();

        const range = document.createRange();
        range.selectNodeContents(node);
        range.collapse(false);

        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      });
    }, [editingId]);

    useEffect(() => {
      if (editingId === null) return;
      const node = editableRefs.current[editingId];
      if (!node) return;
      node.textContent =
        transcripts.find((item) => item.id === editingId)?.text ?? "";
    }, [editingId, transcripts]);

    if (transcripts.length === 0) return null;

    const handleStartEdit = (id: string, text: string) => {
      originalTextRef.current[id] = text;
      setEditingId(id);
    };

    const handleCommit = async (id: string, text: string) => {
      if (savingRef.current[id]) return;
      const node = editableRefs.current[id];
      const originalText = originalTextRef.current[id] ?? text;
      const nextValue = (node?.textContent ?? "").trim();

      if (!nextValue) {
        if (node) node.textContent = originalText;
        setEditingId(null);
        return;
      }

      if (nextValue !== originalText) {
        savingRef.current[id] = true;
        try {
          await onUpdateText(id, nextValue);
          originalTextRef.current[id] = nextValue;
        } finally {
          savingRef.current[id] = false;
        }
      }

      setEditingId(null);
    };

    return (
      <section
        className="audio-recorder__transcriptions"
        aria-label="Transcrições"
      >
        <header className="audio-recorder__transcriptions-header">
          <p className="audio-recorder__transcriptions-eyebrow">Transcrições</p>
        </header>

        <ul className="audio-recorder__transcriptions-list">
          {transcripts.map(({ id, text }) => {
            const isEditing = editingId === id;

            return (
              <li key={id} className="audio-recorder__transcriptions-item">
                <div
                  ref={(node) => {
                    editableRefs.current[id] = node;
                  }}
                  className="audio-recorder__transcriptions-editable"
                  contentEditable={isEditing}
                  suppressContentEditableWarning
                  role="textbox"
                  aria-label="Editar transcrição"
                  aria-multiline="true"
                  tabIndex={0}
                  spellCheck={false}
                  onClick={() => {
                    if (!isEditing) handleStartEdit(id, text);
                  }}
                  onFocus={() => {
                    if (!isEditing) handleStartEdit(id, text);
                  }}
                  onBlur={() => {
                    if (isEditing) void handleCommit(id, text);
                  }}
                  onKeyDown={(event) => {
                    if (!isEditing) return;

                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                      return;
                    }

                    if (event.key === "Escape") {
                      event.preventDefault();
                      const originalText =
                        originalTextRef.current[id] ?? text;
                      event.currentTarget.textContent = originalText;
                      setEditingId(null);
                    }
                  }}
                >
                  {text}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
);

export default TranscribedTextList;
