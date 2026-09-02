import { memo, useEffect, useRef, useState } from "react";

interface TranscribedTextListProps {
  texts: string[];
  recordingId: string | null;
  onUpdateText: (
    recordingId: string,
    index: number,
    text: string,
  ) => Promise<void> | void;
}

const TranscribedTextList = memo(
  ({ texts, recordingId, onUpdateText }: TranscribedTextListProps) => {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const editableRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const originalTextRef = useRef<Record<number, string>>({});
    const savingRef = useRef<Record<number, boolean>>({});

    useEffect(() => {
      if (editingIndex === null) return;
      const node = editableRefs.current[editingIndex];
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
    }, [editingIndex]);

    useEffect(() => {
      if (editingIndex === null) return;
      if (!editableRefs.current[editingIndex]) return;
      editableRefs.current[editingIndex]!.textContent =
        texts[editingIndex] ?? "";
    }, [editingIndex, texts]);

    if (texts.length === 0) return null;

    const handleStartEdit = (index: number, text: string) => {
      originalTextRef.current[index] = text;
      setEditingIndex(index);
    };

    const handleCommit = async (index: number) => {
      if (!recordingId || savingRef.current[index]) return;
      const node = editableRefs.current[index];
      const originalText = originalTextRef.current[index] ?? texts[index] ?? "";
      const nextValue = (node?.textContent ?? "").trim();

      if (!nextValue) {
        if (node) node.textContent = originalText;
        setEditingIndex(null);
        return;
      }

      if (nextValue !== originalText) {
        savingRef.current[index] = true;
        try {
          await onUpdateText(recordingId, index, nextValue);
          originalTextRef.current[index] = nextValue;
        } finally {
          savingRef.current[index] = false;
        }
      }

      setEditingIndex(null);
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
          {texts.map((text, index) => {
            const isEditing = editingIndex === index;

            return (
              <li
                key={`${index}-${text}`}
                className="audio-recorder__transcriptions-item"
              >
                <div
                  ref={(node) => {
                    editableRefs.current[index] = node;
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
                    if (!isEditing) handleStartEdit(index, text);
                  }}
                  onFocus={() => {
                    if (!isEditing) handleStartEdit(index, text);
                  }}
                  onBlur={() => {
                    if (isEditing) void handleCommit(index);
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
                        originalTextRef.current[index] ?? text;
                      event.currentTarget.textContent = originalText;
                      setEditingIndex(null);
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
