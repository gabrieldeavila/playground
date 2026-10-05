import { memo, useEffect, useState } from "react";
import { FiEdit3 } from "react-icons/fi";
import "./history-toggle.css";
import {
  getRecordingById,
  listRecordingTexts,
  updateRecordingName,
  updateRecordingText,
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
import { useNavigate } from "react-router";

type AudioRecorderContentProps = {
  recordingId: string | null;
};

const AudioRecorderContent = memo(
  ({ recordingId }: AudioRecorderContentProps) => {
    const {
      session,
      chunks,
      lastError,
      elapsedSeconds,
      transcripts,
      setTranscripts,
    } = useAudioRecorderBaseContext();
    const navigate = useNavigate();

    const {
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      downloadChunk,
    } = useAudioRecorderServicesContext();
    const [recording, setRecording] = useState<Recording | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [draftTitle, setDraftTitle] = useState("");

    useEffect(() => {
      let isMounted = true;

      void (async () => {
        if (!recordingId) {
          setRecording(null);
          setTranscripts([]);
          return;
        }

        const [found, storedTexts] = await Promise.all([
          getRecordingById(recordingId),
          listRecordingTexts(recordingId),
        ]);

        if (isMounted) {
          setRecording(found ?? null);
          setDraftTitle(found?.name ?? "");
          setTranscripts(storedTexts);
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [recordingId, setTranscripts]);

    const isRecording = session.status === "recording";
    const isPaused = session.status === "paused";
    const recordingTitle = recording?.name?.trim() || "Gravação contínua";

    const handleSaveTitle = async () => {
      const nextTitle = draftTitle.trim();
      if (!recordingId || !nextTitle) return;
      await updateRecordingName(recordingId, nextTitle);
      setRecording((current) =>
        current
          ? { ...current, name: nextTitle, updatedAt: Date.now() }
          : current,
      );
      setIsEditingTitle(false);
    };

    return (
      <section aria-label="Audio recorder" className="audio-recorder">
        <header className="audio-recorder__header">
          <p className="audio-recorder__eyebrow">Aural Studio</p>
          <div className="audio-recorder__title-row">
            {isEditingTitle ? (
              <div className="audio-recorder__title-inline audio-recorder__title-inline--editing">
                <input
                  className="audio-recorder__title-input"
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={() => void handleSaveTitle()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleSaveTitle();
                    if (event.key === "Escape") {
                      setDraftTitle(recording?.name ?? "");
                      setIsEditingTitle(false);
                    }
                  }}
                  size={Math.min(
                    28,
                    Math.max(
                      8,
                      draftTitle.length || recording?.name?.length || 8,
                    ),
                  )}
                  autoFocus
                />
                <button
                  type="button"
                  className="audio-recorder__title-action"
                  aria-label="Confirmar edição do título da gravação"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleSaveTitle()}
                >
                  <FiEdit3 />
                </button>
              </div>
            ) : (
              <div className="audio-recorder__title-inline">
                <h2 className="audio-recorder__title">{recordingTitle}</h2>
                <button
                  type="button"
                  className="audio-recorder__title-action audio-recorder__title-action--visible"
                  aria-label="Editar título da gravação"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <FiEdit3 />
                </button>
              </div>
            )}
          </div>
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
            chunkCount={chunks.length}
          />
          <RecorderTimer elapsedSeconds={elapsedSeconds} />
          <RecorderControls
            isRecording={isRecording}
            isPaused={isPaused}
            onStart={() => void startRecording()}
            onPause={pauseRecording}
            onStop={stopRecording}
            onResume={resumeRecording}
            onBack={() => {
              stopRecording();
              navigate("/");
            }}
          />
          <RecorderErrorBanner error={lastError} />
          <TranscribedTextList
            transcripts={transcripts}
            onUpdateText={async (id, text) => {
              await updateRecordingText(id, text);
              setTranscripts((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, text } : item,
                ),
              );
            }}
          />
          <ChunkAccordion
            chunks={chunks}
            onRetry={(chunkId) => void retryChunk(chunkId)}
            onDownload={downloadChunk}
          />
        </div>
      </section>
    );
  },
);

export default AudioRecorderContent;
