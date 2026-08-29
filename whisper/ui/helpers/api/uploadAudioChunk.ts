import { AUDIO_RECORDER_UPLOAD_ENDPOINT } from "@/types/consts/audio-recorder.const";
import { buildChunkFormData } from "@/helpers/recording/buildChunkFormData";
import type { AudioChunk } from "@/types/interface/audio-recorder.interface";

export const uploadAudioChunk = async (chunk: AudioChunk) => {
  const response = await fetch(AUDIO_RECORDER_UPLOAD_ENDPOINT, {
    method: "POST",
    body: buildChunkFormData(chunk),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload chunk ${chunk.index}`);
  }

  return response.json().catch(() => null);
};
