import { AUDIO_RECORDER_UPLOAD_ENDPOINT } from "@/types/consts/audio-recorder.const";
import { buildChunkFormData } from "@/helpers/recording/buildChunkFormData";
import type { AudioChunk } from "@/types/interface/audio-recorder.interface";

export const uploadAudioChunk = async (chunk: AudioChunk) => {
  const formData = buildChunkFormData(chunk);
  const file = formData.get("file");

  if (file instanceof File && file.type.startsWith("video/")) {
    const audioOnlyBlob = new Blob([file], {
      type: file.type.replace("video/", "audio/"),
    });
    formData.set("file", audioOnlyBlob, file.name.replace(/\.webm$/i, ".webm"));
  }

  const response = await fetch(AUDIO_RECORDER_UPLOAD_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload chunk ${chunk.index}`);
  }

  return response.json().catch(() => null);
};
