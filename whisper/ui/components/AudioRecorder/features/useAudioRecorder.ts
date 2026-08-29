import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_RECORDER_CHUNK_SIZE_SECONDS } from "~types/consts/audio-recorder.const";
import { AudioRecorderStatusEnum } from "~types/enum/audio-recorder-status.enum";
import { createRecorderSession } from "@/helpers/recording/createRecorderSession";
import { getSupportedMimeType } from "@/helpers/recording/getSupportedMimeType";
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
  const mimeTypeRef = useRef("");
  const isUnmountedRef = useRef(false);
  const hasStartedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (uiTimerRef.current) window.clearInterval(uiTimerRef.current);
    if (chunkTimerRef.current) window.clearInterval(chunkTimerRef.current);
    uiTimerRef.current = null;
    chunkTimerRef.current = null;
  }, []);

  const downloadChunk = useCallback((chunk: AudioChunk) => {
    const url = URL.createObjectURL(chunk.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chunk-${chunk.index}.webm`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const sendCurrentChunk = useCallback(async () => {
    if (chunkPartsRef.current.length === 0) return;

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
  }, [session.id]);

  const scheduleChunkFlush = useCallback(() => {
    if (chunkTimerRef.current) window.clearInterval(chunkTimerRef.current);
    chunkTimerRef.current = window.setInterval(async () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.requestData();
        await new Promise((resolve) => setTimeout(resolve, 10));
        void sendCurrentChunk();
      }
    }, AUDIO_RECORDER_CHUNK_SIZE_SECONDS * 1000);
  }, [sendCurrentChunk]);

  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const requestDisplayMediaPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setHasPermission(true);
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      setHasPermission(false);
      setLastError("Permissão para capturar tela/áudio foi negada");
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setLastError(null);
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setIsSupported(false);
      setLastError("Navegador sem suporte a captura de tela/áudio");
      return;
    }
    if (
      hasStartedRef.current &&
      mediaRecorderRef.current?.state === "recording"
    ) {
      return;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setIsSupported(false);
      setLastError("Nenhum mime type de áudio suportado encontrado");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch {
      setLastError("Não foi possível acessar a captura de tela/áudio");
      return;
    }

    setHasPermission(true);
    mediaStreamRef.current = stream;
    mimeTypeRef.current = mimeType;

    const newSessionId = crypto.randomUUID();
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;
    hasStartedRef.current = true;
    chunkPartsRef.current = [];
    chunkStartAtRef.current = getNow();
    chunkIndexRef.current = 0;
    setElapsedSeconds(0);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunkPartsRef.current.push(event.data);
      }
    };

    recorder.start();

    setSession({
      ...createRecorderSession(),
      id: newSessionId,
      startedAt: getNow(),
      status: AudioRecorderStatusEnum.Recording,
      chunkSizeSeconds: AUDIO_RECORDER_CHUNK_SIZE_SECONDS,
    });

    scheduleChunkFlush();

    uiTimerRef.current = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
  }, [scheduleChunkFlush]);

  const pauseRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Pausing,
    }));
    clearTimers();
    recorder.requestData();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await sendCurrentChunk();
    recorder.stop();
    stopStream();
    mediaRecorderRef.current = null;
    hasStartedRef.current = false;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Paused,
    }));
  }, [clearTimers, sendCurrentChunk, stopStream]);

  const resumeRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const stopRecording = useCallback(async () => {
    clearTimers();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.requestData();
      await new Promise((resolve) => setTimeout(resolve, 10));
      await sendCurrentChunk();
      mediaRecorderRef.current.stop();
    }
    stopStream();
    mediaRecorderRef.current = null;
    hasStartedRef.current = false;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Idle,
    }));
    setElapsedSeconds(0);
  }, [clearTimers, sendCurrentChunk, stopStream]);

  const retryChunk = useCallback(async (_chunkId: string) => undefined, []);

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
      requestDisplayMediaPermission,
      downloadChunk,
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
      requestDisplayMediaPermission,
      downloadChunk,
    ],
  );
}
