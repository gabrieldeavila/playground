import AudioRecorder from "@/components/AudioRecorder";
import RecordingModal from "@/components/RecordingModal";
import { useRecorderGateBaseContext } from "@/components/RecorderGate/context/context";
import { listRecordings } from "@/helpers/recording/recordingStorage";
import type { Recording } from "~types/interface/recording.interface";
import { memo, useCallback, useEffect, useState } from "react";
import RecordingsList from "./recordings-list";

const RecorderGateContent = memo(() => {
  const {
    showRecorder,
    setShowRecorder,
    isRecordingModalOpen,
    setIsRecordingModalOpen,
    selectedRecordingId,
    setSelectedRecordingId,
  } = useRecorderGateBaseContext();
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const refreshRecordings = useCallback(async () => {
    const items = await listRecordings();
    setRecordings(items);
  }, []);

  useEffect(() => {
    void refreshRecordings();
  }, [refreshRecordings]);

  const handleCreated = useCallback(
    (recordingId: string) => {
      setSelectedRecordingId(recordingId);
      setShowRecorder(true);
      void refreshRecordings();
    },
    [refreshRecordings, setSelectedRecordingId, setShowRecorder],
  );

  const handleSelectRecording = useCallback(
    (recordingId: string) => {
      setSelectedRecordingId(recordingId);
      setShowRecorder(true);
    },
    [setSelectedRecordingId, setShowRecorder],
  );

  return (
    <div className="recorder-gate">
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
        onCreated={handleCreated}
      />
      {!showRecorder ? (
        <section className="recorder-gate__home">
          <h1 className="recorder-gate__title">Audio Studio</h1>
          <p className="recorder-gate__description">
            Inicie uma nova gravação ou acesse a experiência de áudio.
          </p>
          <button
            type="button"
            className="recorder-gate__button"
            onClick={() => setIsRecordingModalOpen(true)}
          >
            Iniciar nova gravação
          </button>

          <RecordingsList
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={handleSelectRecording}
          />
        </section>
      ) : (
        <div className="recorder-gate__recorder">
          <AudioRecorder recordingId={selectedRecordingId} />
        </div>
      )}
    </div>
  );
});

export default RecorderGateContent;
