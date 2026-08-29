export const getSupportedMimeType = () => {
  const candidates = [
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9,opus",
    "video/webm",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];

  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return (
    candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? ""
  );
};
