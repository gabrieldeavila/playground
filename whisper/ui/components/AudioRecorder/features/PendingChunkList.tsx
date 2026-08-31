import { memo } from "react";
import type { AudioChunk } from "~types/interface/audio-recorder.interface";

interface PendingChunkListProps {
  chunks: AudioChunk[];
  onRetry: (chunkId: string) => void;
  onDownload: (chunk: AudioChunk) => void;
}

const PendingChunkList = memo(
  ({ chunks, onRetry, onDownload }: PendingChunkListProps) => {
    if (!chunks.length) return null;

    return (
      <ul className="audio-recorder__queue">
        {chunks.map((chunk, index) => (
          <li
            key={chunk.id}
            className={`audio-recorder__queue-item audio-recorder__queue-item--${chunk.status}`}
          >
            <div>
              <strong>Chunk #{index + 1}</strong>
              <p>{chunk.durationMs}ms</p>
              {chunk.errorMessage ? <p>{chunk.errorMessage}</p> : null}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" onClick={() => onDownload(chunk)}>
                Download
              </button>
              {chunk.status === "failed" ? (
                <button type="button" onClick={() => onRetry(chunk.id)}>
                  Reenviar
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );
  },
);

export default PendingChunkList;
