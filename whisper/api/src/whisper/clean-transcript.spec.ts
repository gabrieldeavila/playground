import { cleanTranscript } from './clean-transcript';

describe('cleanTranscript', () => {
  it('removes timestamps and joins lines', () => {
    const raw = [
      '[00:00:00.000 --> 00:00:04.000]   Olá, tudo bem?',
      '[00:00:04.000 --> 00:00:08.500]   Vamos começar.',
    ].join('\n');

    expect(cleanTranscript(raw)).toBe('Olá, tudo bem? Vamos começar.');
  });

  it('removes non-speech markers', () => {
    expect(cleanTranscript('[BLANK_AUDIO]\n')).toBe('');
    expect(cleanTranscript('[00:00:00.000 --> 00:00:02.000] [Música] oi')).toBe(
      'oi',
    );
  });

  it('returns an empty string for empty input', () => {
    expect(cleanTranscript('')).toBe('');
  });
});
