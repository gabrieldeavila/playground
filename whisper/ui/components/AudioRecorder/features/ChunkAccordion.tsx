import { memo, useMemo, useState } from "react";
import type { AudioChunk } from "~types/interface/audio-recorder.interface";

type ChunkAccordionProps = {
  chunks: AudioChunk[];
  onRetry: (chunkId: string) => void;
  onDownload: (chunk: AudioChunk) => void;
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={`audio-recorder__icon audio-recorder__icon--chevron ${open ? "is-open" : ""}`}
  >
    <path
      d="M6 9l6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="audio-recorder__icon">
    <path
      d="M12 3v10m0 0 4-4m-4 4-4-4M5 17v3h14v-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TranslateIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="audio-recorder__icon">
    <path
      d="M4 6h7M7 6c0 6 2 9 5 12M10 18l4-12M13 6h7M17 18l-2-5m0 0h4m-4 0 2-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChunkAccordion = memo(
  ({ chunks, onRetry, onDownload }: ChunkAccordionProps) => {
    const [open, setOpen] = useState(false);
    const [translationChunkId, setTranslationChunkId] = useState<string | null>(
      null,
    );

    const sortedChunks = useMemo(() => chunks, [chunks]);
    if (!sortedChunks.length) return null;

    return (
      <section
        className="audio-recorder__accordion"
        aria-label="Chunks de áudio"
      >
        <button
          type="button"
          className="audio-recorder__accordion-trigger"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <div>
            <p className="audio-recorder__accordion-eyebrow">Chunks</p>
            <h3 className="audio-recorder__accordion-title">
              Histórico de gravações
            </h3>
          </div>
          <div className="audio-recorder__accordion-trigger-meta">
            <span>{sortedChunks.length}</span>
            <ChevronIcon open={open} />
          </div>
        </button>

        {open ? (
          <ul className="audio-recorder__chunk-list">
            {sortedChunks.map((chunk, index) => {
              const isTranslationOpen = translationChunkId === chunk.id;
              return (
                <li
                  key={chunk.id}
                  className={`audio-recorder__chunk-item audio-recorder__chunk-item--${chunk.status}`}
                >
                  <div className="audio-recorder__chunk-main">
                    <div>
                      <p className="audio-recorder__chunk-label">
                        Chunk #{index + 1}
                      </p>
                      <p className="audio-recorder__chunk-meta">
                        {chunk.durationMs}ms · {chunk.status}
                      </p>
                      {chunk.errorMessage ? (
                        <p className="audio-recorder__chunk-error">
                          {chunk.errorMessage}
                        </p>
                      ) : null}
                    </div>
                    <div className="audio-recorder__chunk-actions">
                      <button
                        type="button"
                        className="audio-recorder__icon-button"
                        onClick={() => onDownload(chunk)}
                        aria-label={`Download do chunk ${index + 1}`}
                      >
                        <DownloadIcon />
                      </button>
                      <button
                        type="button"
                        className="audio-recorder__icon-button"
                        onClick={() =>
                          setTranslationChunkId((current) =>
                            current === chunk.id ? null : chunk.id,
                          )
                        }
                        aria-label={`Ver tradução do chunk ${index + 1}`}
                      >
                        <TranslateIcon />
                      </button>
                      {chunk.status === "failed" ? (
                        <button
                          type="button"
                          className="audio-recorder__retry"
                          onClick={() => onRetry(chunk.id)}
                        >
                          Reenviar
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {isTranslationOpen ? (
                    <div className="audio-recorder__chunk-translation">
                      <p className="audio-recorder__chunk-translation-text">
                        {chunk.text ?? "Texto ainda indisponível."}
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    );
  },
);

export default ChunkAccordion;
