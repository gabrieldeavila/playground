import { memo } from "react";

interface RecorderControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onResume: () => void;
}

const RecorderControls = memo(
  ({
    isRecording,
    isPaused,
    onStart,
    onPause,
    onStop,
    onResume,
  }: RecorderControlsProps) => {
    return (
      <div className="audio-recorder__actions">
        {!isRecording && !isPaused ? (
          <button type="button" onClick={onStart}>
            Gravar
          </button>
        ) : null}

        {isRecording ? (
          <button type="button" onClick={onPause}>
            Pausar
          </button>
        ) : null}

        {isPaused ? (
          <button type="button" onClick={onResume}>
            Retomar
          </button>
        ) : null}

        <button type="button" onClick={onStop}>
          Parar
        </button>
      </div>
    );
  },
);

export default RecorderControls;
