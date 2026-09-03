import AudioRecorder from "@/components/AudioRecorder";
import RecordingModal from "@/components/RecordingModal";
import { useRecorderGateBaseContext } from "@/components/RecorderGate/context/context";
import {
  deleteRecording,
  listRecordings,
} from "@/helpers/recording/recordingStorage";
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
  const [deleteTarget, setDeleteTarget] = useState<Recording | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleRequestDeleteRecording = useCallback(
    (recording: Recording) => {
      setDeleteTarget(recording);
      setIsRecordingModalOpen(true);
    },
    [setIsRecordingModalOpen],
  );

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDeleteTarget(null);
    setIsRecordingModalOpen(false);
  }, [isDeleting, setIsRecordingModalOpen]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRecording(deleteTarget.id);
      if (selectedRecordingId === deleteTarget.id) {
        setSelectedRecordingId(null);
        setShowRecorder(false);
      }
      setDeleteTarget(null);
      setIsRecordingModalOpen(false);
      await refreshRecordings();
    } finally {
      setIsDeleting(false);
    }
  }, [
    deleteTarget,
    refreshRecordings,
    selectedRecordingId,
    setSelectedRecordingId,
    setShowRecorder,
    setIsRecordingModalOpen,
  ]);

  return (
    <div className="recorder-gate">
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => {
          setIsRecordingModalOpen(false);
          setDeleteTarget(null);
        }}
        onCreated={handleCreated}
        mode={deleteTarget ? "delete" : "create"}
        deleteTargetName={deleteTarget?.name}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeleting}
        onCancelDelete={handleCloseDeleteModal}
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
            onClick={() => {
              setDeleteTarget(null);
              setIsRecordingModalOpen(true);
            }}
          >
            Iniciar nova gravação
          </button>

          <RecordingsList
            recordings={recordings}
            selectedRecordingId={selectedRecordingId}
            onSelectRecording={handleSelectRecording}
            onRequestDeleteRecording={handleRequestDeleteRecording}
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
