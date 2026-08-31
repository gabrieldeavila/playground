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
        <p className="audio-recorder__transcriptions-eyebrow">Transcrições</p>
        <h3 className="audio-recorder__transcriptions-title">
          Texto retornado
        </h3>
      </header>

      <ul className="audio-recorder__transcriptions-list">
        {texts.map((text) => (
          <li key={text} className="audio-recorder__transcriptions-item">
            <p className="audio-recorder__transcriptions-text">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
});

export default TranscribedTextList;
