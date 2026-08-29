import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_RECORDER_CHUNK_SIZE_SECONDS } from "~types/consts/audio-recorder.const";
import { AudioRecorderStatusEnum } from "~types/enum/audio-recorder-status.enum";
import { createRecorderSession } from "@/helpers/recording/createRecorderSession";
import { getSupportedMimeType } from "@/helpers/recording/getSupportedMimeType";
import { uploadAudioChunk } from "@/helpers/api/uploadAudioChunk";
import type {
  AudioChunk,
  AudioRecorderSession,
} from "~types/interface/audio-recorder.interface";

const getNow = () => Date.now();

export function useAudioRecorder() {
  const [session, setSession] = useState<AudioRecorderSession>(
    createRecorderSession(),
  );
  const [pendingChunks, setPendingChunks] = useState<AudioChunk[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkPartsRef = useRef<BlobPart[]>([]);
  const chunkStartAtRef = useRef<number | null>(null);
  const uiTimerRef = useRef<number | null>(null);
  const chunkTimerRef = useRef<number | null>(null);
  const chunkIndexRef = useRef(0);
  const uploadQueueRef = useRef(Promise.resolve());
  const mimeTypeRef = useRef("");
  const isUnmountedRef = useRef(false);
  const hasStartedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (uiTimerRef.current) window.clearInterval(uiTimerRef.current);
    if (chunkTimerRef.current) window.clearInterval(chunkTimerRef.current);
    uiTimerRef.current = null;
    chunkTimerRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const enqueueUpload = useCallback((chunk: AudioChunk) => {
    uploadQueueRef.current = uploadQueueRef.current
      .then(async () => {
        setPendingChunks((current) =>
          current.map((item) =>
            item.id === chunk.id ? { ...item, status: "uploading" } : item,
          ),
        );
        try {
          await uploadAudioChunk(chunk);
          if (isUnmountedRef.current) return;
          setPendingChunks((current) =>
            current.map((item) =>
              item.id === chunk.id ? { ...item, status: "sent" } : item,
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Upload failed";
          if (isUnmountedRef.current) return;
          setLastError(message);
          setPendingChunks((current) =>
            current.map((item) =>
              item.id === chunk.id
                ? { ...item, status: "failed", errorMessage: message }
                : item,
            ),
          );
          throw error;
        }
      })
      .catch(() => undefined);
  }, []);

  const flushChunk = useCallback(async () => {
    if (!mediaRecorderRef.current || chunkPartsRef.current.length === 0) return;
    const startedAt = chunkStartAtRef.current ?? getNow();
    const durationMs = Math.max(1, getNow() - startedAt);
    const blob = new Blob(chunkPartsRef.current, {
      type: mimeTypeRef.current || "audio/webm",
    });
    const chunk: AudioChunk = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      index: chunkIndexRef.current,
      blob,
      durationMs,
      createdAt: getNow(),
      status: "pending",
    };
    chunkIndexRef.current += 1;
    chunkPartsRef.current = [];
    chunkStartAtRef.current = getNow();
    setPendingChunks((current) => [...current, chunk]);
    await enqueueUpload(chunk);
  }, [enqueueUpload, session.id]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      setHasPermission(false);
      setLastError("Permissão do microfone negada");
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setLastError(null);
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setLastError("Navegador sem suporte a captura de áudio");
      return;
    }
    if (
      hasStartedRef.current &&
      mediaRecorderRef.current?.state === "recording"
    )
      return;

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setIsSupported(false);
      setLastError("Nenhum mime type de áudio suportado encontrado");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setHasPermission(true);
    mediaStreamRef.current = stream;
    mimeTypeRef.current = mimeType;

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    hasStartedRef.current = true;
    chunkPartsRef.current = [];
    chunkStartAtRef.current = getNow();
    chunkIndexRef.current = 0;
    setElapsedSeconds(0);
    setSession({
      ...createRecorderSession(),
      id: crypto.randomUUID(),
      startedAt: getNow(),
      status: AudioRecorderStatusEnum.Recording,
      chunkSizeSeconds: AUDIO_RECORDER_CHUNK_SIZE_SECONDS,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunkPartsRef.current.push(event.data);
    };

    recorder.start();
    uiTimerRef.current = window.setInterval(
      () => setElapsedSeconds((current) => current + 1),
      1000,
    );
    chunkTimerRef.current = window.setInterval(() => {
      void flushChunk();
    }, AUDIO_RECORDER_CHUNK_SIZE_SECONDS * 1000);
  }, [flushChunk]);

  const pauseRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Pausing,
    }));
    clearTimers();
    try {
      recorder.requestData();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
    await flushChunk();
    stopStream();
    mediaRecorderRef.current = null;
    hasStartedRef.current = false;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Paused,
    }));
  }, [clearTimers, flushChunk, stopStream]);

  const resumeRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const stopRecording = useCallback(async () => {
    clearTimers();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      mediaRecorderRef.current.stop();
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
    await flushChunk();
    stopStream();
    mediaRecorderRef.current = null;
    hasStartedRef.current = false;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Idle,
    }));
    setElapsedSeconds(0);
  }, [clearTimers, flushChunk, stopStream]);

  const retryChunk = useCallback(
    async (chunkId: string) => {
      const chunk = pendingChunks.find((item) => item.id === chunkId);
      if (!chunk) return;
      setPendingChunks((current) =>
        current.map((item) =>
          item.id === chunkId
            ? { ...item, status: "pending", errorMessage: undefined }
            : item,
        ),
      );
      await enqueueUpload({
        ...chunk,
        status: "pending",
        errorMessage: undefined,
      });
    },
    [enqueueUpload, pendingChunks],
  );

  useEffect(
    () => () => {
      isUnmountedRef.current = true;
      clearTimers();
      stopStream();
    },
    [clearTimers, stopStream],
  );

  return useMemo(
    () => ({
      session,
      pendingChunks,
      lastError,
      elapsedSeconds,
      isSupported,
      hasPermission,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      requestMicrophonePermission,
    }),
    [
      session,
      pendingChunks,
      lastError,
      elapsedSeconds,
      isSupported,
      hasPermission,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      requestMicrophonePermission,
    ],
  );
}
