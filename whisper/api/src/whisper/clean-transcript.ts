// whisper-cli prints lines like "[00:00:00.000 --> 00:00:05.000]  texto" and
// non-speech markers like "[BLANK_AUDIO]"; both are noise for the UI.
const BRACKETED = /\[[^\]]*\]/g;

export function cleanTranscript(raw: string): string {
  return raw.replace(BRACKETED, ' ').replace(/\s+/g, ' ').trim();
}
