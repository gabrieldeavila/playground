import { memo, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import { useRecordingModalBaseContext } from "../../context/context";

const RecordingModalContent = memo(() => {
  const {
    isOpen,
    mode,
    recordingName,
    deleteTargetName,
    isDeleting,
    setRecordingName,
    setIsOpen,
    handleCreateRecording,
    onConfirmDelete,
    onCancelDelete,
  } = useRecordingModalBaseContext();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (mode === "delete") {
          onCancelDelete?.();
          return;
        }
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, mode, onCancelDelete, setIsOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const isDeleteMode = mode === "delete";
  const titleId = "recording-modal-title";
  const descriptionId = isDeleteMode
    ? "delete-recording-description"
    : "create-recording-description";

  return createPortal(
    <div
      className={`recording-modal${isDeleteMode ? " recording-modal--danger" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <button
        type="button"
        className="recording-modal__backdrop"
        aria-label="Fechar modal"
        onClick={() => (isDeleteMode ? onCancelDelete?.() : setIsOpen(false))}
      />
      <div className="recording-modal__content">
        <button
          type="button"
          className="recording-modal__close"
          aria-label="Fechar modal"
          onClick={() => (isDeleteMode ? onCancelDelete?.() : setIsOpen(false))}
        >
          <FiX />
        </button>
        {isDeleteMode ? (
          <>
            <div className="recording-modal__icon" aria-hidden="true">
              <FiAlertTriangle />
            </div>
            <p className="recording-modal__eyebrow">Atenção</p>
            <h2 id={titleId} className="recording-modal__title">
              Confirmar exclusão
            </h2>
            <p className="recording-modal__description" id={descriptionId}>
              Tem certeza que deseja deletar a gravação “{deleteTargetName}”?
              Essa ação não pode ser desfeita.
            </p>
            <div className="recording-modal__actions recording-modal__actions--danger">
              <button
                type="button"
                className="recording-modal__button recording-modal__button--secondary"
                onClick={() => onCancelDelete?.()}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="recording-modal__button recording-modal__button--danger"
                onClick={() => void onConfirmDelete?.()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deletando..." : "Deletar gravação"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id={titleId} className="recording-modal__title">
              Nova gravação
            </h2>
            <p className="recording-modal__description" id={descriptionId}>
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
          </>
        )}
      </div>
    </div>,
    document.body,
  );
});

export default RecordingModalContent;
