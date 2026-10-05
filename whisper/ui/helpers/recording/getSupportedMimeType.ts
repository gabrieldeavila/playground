const AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
];

export const getSupportedMimeType = () => {
  if (typeof MediaRecorder === "undefined") return "";

  return (
    AUDIO_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ??
    ""
  );
};

export const getExtensionForMimeType = (mimeType: string) => {
  if (mimeType.includes("mp4")) return "mp4";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
};
