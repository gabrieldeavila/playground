import { AUDIO_RECORDER_UPLOAD_ENDPOINT } from "@/types/consts/audio-recorder.const";
import type { AudioChunk } from "@/types/interface/audio-recorder.interface";

export const buildChunkFormData = (chunk: AudioChunk) => {
  const formData = new FormData();
  const isVideoChunk = chunk.blob.type.startsWith("video/");
  const extension = chunk.blob.type.includes("mp4") ? "mp4" : "webm";
  const file = new File([chunk.blob], `chunk-${chunk.index}.${extension}`, {
    type: chunk.blob.type || (isVideoChunk ? "video/webm" : "audio/webm"),
  });

  formData.append(isVideoChunk ? "media" : "audio", file);
  formData.append("sessionId", chunk.sessionId);
  formData.append("chunkIndex", String(chunk.index));
  formData.append("durationMs", String(chunk.durationMs));
  formData.append("createdAt", String(chunk.createdAt));
  formData.append("uploadEndpoint", AUDIO_RECORDER_UPLOAD_ENDPOINT);

  return formData;
};
