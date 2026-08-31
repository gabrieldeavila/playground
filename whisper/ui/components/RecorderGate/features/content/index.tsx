import AudioRecorder from "@/components/AudioRecorder";
import RecordingModal from "@/components/RecordingModal";
import { useRecorderGateBaseContext } from "@/components/RecorderGate/context/context";
import { memo } from "react";

const RecorderGateContent = memo(() => {
  const {
    showRecorder,
    setShowRecorder,
    isRecordingModalOpen,
    setIsRecordingModalOpen,
  } = useRecorderGateBaseContext();

  return (
    <div className="recorder-gate">
      <RecordingModal
        isOpen={isRecordingModalOpen}
        onClose={() => setIsRecordingModalOpen(false)}
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
          <button
            type="button"
            className="recorder-gate__button"
            onClick={() => setShowRecorder(true)}
          >
            Iniciar gravação
          </button>
        </section>
      ) : (
        <div className="recorder-gate__recorder">
          <AudioRecorder />
        </div>
      )}
    </div>
  );
});

export default RecorderGateContent;
