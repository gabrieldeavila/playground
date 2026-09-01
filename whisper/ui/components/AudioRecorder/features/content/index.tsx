import { memo, useEffect, useState } from "react";
import { useRecorderGateBaseContext } from "@/components/RecorderGate/context/context";
import {
  listRecordings,
  listRecordingTexts,
} from "@/helpers/recording/recordingStorage";
import type { Recording } from "~types/interface/recording.interface";
import {
  useAudioRecorderBaseContext,
  useAudioRecorderServicesContext,
} from "../../context/context";
import RecorderControls from "../RecorderControls";
import RecorderErrorBanner from "../RecorderErrorBanner";
import ChunkAccordion from "../ChunkAccordion";
import RecorderStatus from "../RecorderStatus";
import RecorderTimer from "../RecorderTimer";
import TranscribedTextList from "../TranscribedTextList";

type AudioRecorderContentProps = {
  recordingId: string | null;
};

const AudioRecorderContent = memo(
  ({ recordingId }: AudioRecorderContentProps) => {
    const {
      session,
      pendingChunks,
      lastError,
      elapsedSeconds,
      transcribedTexts,
      setTranscribedTexts,
    } = useAudioRecorderBaseContext();

    const {
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      downloadChunk,
    } = useAudioRecorderServicesContext();
    const [recording, setRecording] = useState<Recording | null>(null);

    useEffect(() => {
      let isMounted = true;

      void (async () => {
        if (!recordingId) {
          setRecording(null);
          setTranscribedTexts([]);
          return;
        }

        const recordings = await listRecordings();
        const found =
          recordings.find((item) => item.id === recordingId) ?? null;
        const storedTexts = await listRecordingTexts(recordingId);

        if (isMounted) {
          setRecording(found);
          setTranscribedTexts(storedTexts.map((item) => item.text));
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [recordingId, setTranscribedTexts]);

    const isRecording = session.status === "recording";
    const isPaused = session.status === "paused";
    const recordingTitle = recording?.name?.trim() || "Gravação contínua";

    return (
      <section aria-label="Audio recorder" className="audio-recorder">
        <header className="audio-recorder__header">
          <p className="audio-recorder__eyebrow">Continuous capture</p>
          <h2 className="audio-recorder__title">{recordingTitle}</h2>
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
          <ChunkAccordion
            chunks={pendingChunks}
            onRetry={(chunkId) => void retryChunk(chunkId)}
            onDownload={(chunk) => void downloadChunk(chunk)}
          />
        </div>
      </section>
    );
  },
);

export default AudioRecorderContent;
