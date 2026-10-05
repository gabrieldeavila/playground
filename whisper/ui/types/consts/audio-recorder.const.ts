export const AUDIO_RECORDER_CHUNK_SIZE_SECONDS = 180;
export const AUDIO_RECORDER_UPLOAD_ENDPOINT = `${
  import.meta.env.VITE_API_URL ?? "http://localhost:3099"
}/whisper/transcribe`;
