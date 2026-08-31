import { memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { useRecordingModalBaseContext } from "../../context/context";

const RecordingModalContent = memo(() => {
  const {
    isOpen,
    recordingName,
    setRecordingName,
    setIsOpen,
    handleCreateRecording,
  } = useRecordingModalBaseContext();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="recording-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recording-modal-title"
    >
      <button
        type="button"
        className="recording-modal__backdrop"
        aria-label="Fechar modal"
        onClick={() => setIsOpen(false)}
      />
      <div className="recording-modal__content">
        <button
          type="button"
          className="recording-modal__close"
          aria-label="Fechar modal"
          onClick={() => setIsOpen(false)}
        >
          <FiX />
        </button>
        <h2 id="recording-modal-title" className="recording-modal__title">
          Nova gravação
        </h2>
        <p className="recording-modal__description">
          Informe apenas o nome da gravação.
        </p>
        <input
          className="recording-modal__input"
          type="text"
          value={recordingName}
          onChange={(event) => setRecordingName(event.target.value)}
          placeholder="Nome da gravação"
          autoFocus
        />
        <div className="recording-modal__actions">
          <button
            type="button"
            className="recording-modal__button"
            onClick={handleCreateRecording}
          >
            Criar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});

export default RecordingModalContent;
