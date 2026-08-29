import { memo } from "react";

interface RecorderTimerProps {
  elapsedSeconds: number;
}

const formatTime = (totalSeconds: number) => {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const RecorderTimer = memo(({ elapsedSeconds }: RecorderTimerProps) => {
  return (
    <div className="audio-recorder__timer">{formatTime(elapsedSeconds)}</div>
  );
});

export default RecorderTimer;
