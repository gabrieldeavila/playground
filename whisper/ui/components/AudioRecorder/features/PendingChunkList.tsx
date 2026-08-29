import { memo } from "react";
import type { AudioChunk } from "~types/interface/audio-recorder.interface";

interface PendingChunkListProps {
  chunks: AudioChunk[];
  onRetry: (chunkId: string) => void;
}

const PendingChunkList = memo(({ chunks, onRetry }: PendingChunkListProps) => {
  if (!chunks.length) return null;

  return (
    <ul className="audio-recorder__queue">
      {chunks.map((chunk) => (
        <li
          key={chunk.id}
          className={`audio-recorder__queue-item audio-recorder__queue-item--${chunk.status}`}
        >
          <div>
            <strong>Chunk #{chunk.index}</strong>
            <p>{chunk.durationMs}ms</p>
            {chunk.errorMessage ? <p>{chunk.errorMessage}</p> : null}
          </div>
          {chunk.status === "failed" ? (
            <button type="button" onClick={() => onRetry(chunk.id)}>
              Reenviar
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
});

export default PendingChunkList;
