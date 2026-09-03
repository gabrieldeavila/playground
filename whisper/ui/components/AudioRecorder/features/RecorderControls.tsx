import { memo } from "react";

interface RecorderControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onResume: () => void;
  onBack: () => void;
}

const RecorderControls = memo(
  ({
    isRecording,
    isPaused,
    onStart,
    onPause,
    onStop,
    onResume,
    onBack,
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
        <button type="button" onClick={onBack}>
          Voltar
        </button>
      </div>
    );
  },
);

export default RecorderControls;
