import type { Recording } from "~types/interface/recording.interface";
import { memo } from "react";

type RecordingsListProps = {
  recordings: Recording[];
  selectedRecordingId: string | null;
  onSelectRecording: (recordingId: string) => void;
};

const RecordingsList = memo(
  ({
    recordings,
    selectedRecordingId,
    onSelectRecording,
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
          <h2 className="recorder-gate-recordings__title">Gravações salvas</h2>
        </div>

        <ul className="recorder-gate-recordings__list">
          {recordings.map((recording) => {
            const isActive = recording.id === selectedRecordingId;

            return (
              <li key={recording.id} className="recorder-gate-recordings__item">
                <button
                  type="button"
                  className={`recorder-gate-recordings__button${
                    isActive ? " recorder-gate-recordings__button--active" : ""
                  }`}
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

                  <span className="recorder-gate-recordings__badge">
                    {isActive ? "Ativa" : "Abrir"}
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
