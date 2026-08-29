import { memo } from "react";

interface RecorderStatusProps {
  label: string;
  pendingChunks: number;
}

const RecorderStatus = memo(({ label, pendingChunks }: RecorderStatusProps) => {
  return (
    <div className="audio-recorder__status" aria-live="polite">
      <span className="audio-recorder__dot" />
      <span>{label}</span>
      <span className="audio-recorder__badge">{pendingChunks} chunks</span>
    </div>
  );
});

export default RecorderStatus;
