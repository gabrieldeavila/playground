import { AUDIO_RECORDER_CHUNK_SIZE_SECONDS } from "@/types/consts/audio-recorder.const";
import type { AudioRecorderSession } from "@/types/interface/audio-recorder.interface";

export const createRecorderSession = (): AudioRecorderSession => ({
  id: crypto.randomUUID(),
  startedAt: null,
  chunkSizeSeconds: AUDIO_RECORDER_CHUNK_SIZE_SECONDS,
  status: "idle",
});
