import { memo } from "react";

interface TranscribedTextListProps {
  texts: string[];
}

const TranscribedTextList = memo(({ texts }: TranscribedTextListProps) => {
  if (!texts.length) return null;

  return (
    <section
      className="audio-recorder__transcriptions"
      aria-label="Transcrições"
    >
      <header className="audio-recorder__transcriptions-header">
        <h3 className="audio-recorder__transcriptions-title">
          Texto retornado
        </h3>
      </header>

      <ul className="audio-recorder__transcriptions-list">
        {texts.map((text, index) => (
          <li
            key={`${index}-${text}`}
            className="audio-recorder__transcriptions-item"
          >
            <span className="audio-recorder__transcriptions-index">
              {index + 1}
            </span>
            <p className="audio-recorder__transcriptions-text">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
});

export default TranscribedTextList;
