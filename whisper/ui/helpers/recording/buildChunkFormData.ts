import type { AudioChunk } from "@/types/interface/audio-recorder.interface";

export const buildChunkFormData = (chunk: AudioChunk) => {
  const formData = new FormData();

  formData.append(
    "audio",
    chunk.blob,
    `chunk-${chunk.index}.${chunk.blob.type.split("/")[1] || "webm"}`,
  );
  formData.append("sessionId", chunk.sessionId);
  formData.append("chunkIndex", String(chunk.index));
  formData.append("durationMs", String(chunk.durationMs));
  formData.append("createdAt", String(chunk.createdAt));
  formData.append("mimeType", chunk.blob.type);

  return formData;
};
