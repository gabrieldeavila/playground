import type { Recording } from "~types/interface/recording.interface";
import { memo } from "react";

type RecordingsListProps = {
  recordings: Recording[];
  selectedRecordingId: string | null;
  onSelectRecording: (recordingId: string) => void;
  onRequestDeleteRecording: (recording: Recording) => void;
};

const RecordingsList = memo(
  ({
    recordings,
    selectedRecordingId,
    onSelectRecording,
    onRequestDeleteRecording,
  }: RecordingsListProps) => {
    if (recordings.length === 0) {
      return (
        <div className="recorder-gate-recordings recorder-gate-recordings--empty">
          <p className="recorder-gate-recordings__empty-title">
            Nenhuma gravação ainda
          </p>
          <p className="recorder-gate-recordings__empty-description">
            Suas gravações salvas aparecerão aqui.
          </p>
        </div>
      );
    }

    return (
      <section
        className="recorder-gate-recordings"
        aria-label="Gravações salvas"
      >
        <div className="recorder-gate-recordings__header">
          <span className="recorder-gate-recordings__eyebrow">Biblioteca</span>
        </div>

        <ul className="recorder-gate-recordings__list">
          {recordings.map((recording) => {
            const isActive = recording.id === selectedRecordingId;

            return (
              <li key={recording.id} className="recorder-gate-recordings__item">
                <button
                  type="button"
                  className={`recorder-gate-recordings__button${isActive ? " recorder-gate-recordings__button--active" : ""}`}
                  onClick={() => onSelectRecording(recording.id)}
                >
                  <span className="recorder-gate-recordings__meta">
                    <span className="recorder-gate-recordings__name">
                      {recording.name}
                    </span>
                    <span className="recorder-gate-recordings__date">
                      {new Date(recording.createdAt).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </span>

                  <span className="recorder-gate-recordings__actions">
                    <span className="recorder-gate-recordings__badge">
                      {isActive ? "Ativa" : "Abrir"}
                    </span>
                    <button
                      type="button"
                      className="recorder-gate-recordings__badge recorder-gate-recordings__badge--danger"
                      aria-label={`Deletar gravação ${recording.name}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRequestDeleteRecording(recording);
                      }}
                    >
                      Deletar
                    </button>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
);

export default RecordingsList;
