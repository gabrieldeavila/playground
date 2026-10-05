import { getExtensionForMimeType } from "@/helpers/recording/getSupportedMimeType";
import type { AudioChunk } from "@/types/interface/audio-recorder.interface";

export const buildChunkFormData = (chunk: AudioChunk) => {
  const formData = new FormData();
  const type = chunk.blob.type || "audio/webm";
  const file = new File(
    [chunk.blob],
    `chunk-${chunk.index}.${getExtensionForMimeType(type)}`,
    { type },
  );

  formData.append("audio", file);

  return formData;
};
