import { memo } from "react";
import {
  useAudioRecorderBaseContext,
  useAudioRecorderServicesContext,
} from "../../context/context";
import RecorderControls from "../RecorderControls";
import RecorderErrorBanner from "../RecorderErrorBanner";
import PendingChunkList from "../PendingChunkList";
import RecorderStatus from "../RecorderStatus";
import RecorderTimer from "../RecorderTimer";
import TranscribedTextList from "../TranscribedTextList";

const AudioRecorderContent = memo(() => {
  const {
    session,
    pendingChunks,
    lastError,
    elapsedSeconds,
    transcribedTexts,
  } = useAudioRecorderBaseContext();
  const {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    retryChunk,
    downloadChunk,
  } = useAudioRecorderServicesContext();

  const isRecording = session.status === "recording";
  const isPaused = session.status === "paused";

  return (
    <section aria-label="Audio recorder" className="audio-recorder">
      <header className="audio-recorder__header">
        <p className="audio-recorder__eyebrow">Continuous capture</p>
        <h2 className="audio-recorder__title">Gravação contínua</h2>
        <p className="audio-recorder__description">
          Capture áudio em blocos periódicos e baixe cada chunk individualmente.
        </p>
      </header>

      <div className="audio-recorder__panel">
        <RecorderStatus
          label={
            lastError
              ? "Erro na captura"
              : session.status === "recording"
                ? "Gravando"
                : isPaused
                  ? "Pausado"
                  : "Pronto para iniciar a captura"
          }
          pendingChunks={pendingChunks.length}
        />

        <RecorderTimer elapsedSeconds={elapsedSeconds} />

        <RecorderControls
          isRecording={isRecording}
          isPaused={isPaused}
          onStart={() => void startRecording()}
          onPause={() => void pauseRecording()}
          onStop={() => void stopRecording()}
          onResume={() => void resumeRecording()}
        />

        <RecorderErrorBanner error={lastError} />
        <TranscribedTextList texts={transcribedTexts} />
        <PendingChunkList
          chunks={pendingChunks}
          onRetry={(chunkId) => void retryChunk(chunkId)}
          onDownload={(chunk) => void downloadChunk(chunk)}
        />
      </div>
    </section>
  );
});

export default AudioRecorderContent;
