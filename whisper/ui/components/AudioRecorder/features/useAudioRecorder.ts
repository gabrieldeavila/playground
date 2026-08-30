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

type UploadAudioChunkResponse = {
  text?: string;
};

export function useAudioRecorder() {
  const [session, setSession] = useState<AudioRecorderSession>(
    createRecorderSession(),
  );
  const [pendingChunks, setPendingChunks] = useState<AudioChunk[]>([]);
  const [transcribedTexts, setTranscribedTexts] = useState<string[]>([
    "de Madri e onde, de fato, o Trato de Madri foi debatido e pouco da guerra do Paraguai.\nEntão agora nós..."
]);
  console.log(transcribedTexts);
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

    try {
      const response = (await uploadAudioChunk(
        chunk,
      )) as UploadAudioChunkResponse | null;
      console.log(response);
      const text = response?.text;
      if (typeof text === "string") {
        setTranscribedTexts((current) => [...current, text]);
      }
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : "Falha ao enviar áudio",
      );
    }
  }, [session.id]);

  const flushCurrentChunk = useCallback(() => {
    void sendCurrentChunk();
  }, [sendCurrentChunk]);

  const scheduleChunkFlush = useCallback(() => {
    if (chunkTimerRef.current) window.clearInterval(chunkTimerRef.current);
    chunkTimerRef.current = window.setInterval(() => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    }, AUDIO_RECORDER_CHUNK_SIZE_SECONDS * 1000);
  }, []);

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
    if (typeof window === "undefined" || typeof navigator === "undefined")
      return;
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setIsSupported(false);
      setLastError("Navegador sem suporte a captura de tela/áudio");
      return;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setIsSupported(false);
      setLastError("Nenhum mime type de áudio suportado encontrado");
      return;
    }

    const audioMimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ].find((candidate) => MediaRecorder.isTypeSupported(candidate));
    if (!audioMimeType) {
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

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      stream.getTracks().forEach((track) => track.stop());
      setLastError(
        "Nenhuma trilha de áudio foi capturada na janela compartilhada",
      );
      return;
    }

    setHasPermission(true);
    mediaStreamRef.current = stream;
    mimeTypeRef.current = audioMimeType;

    const newSessionId = crypto.randomUUID();
    const audioOnlyStream = new MediaStream(audioTracks);
    const recorder = new MediaRecorder(audioOnlyStream, {
      mimeType: audioMimeType,
    });
    mediaRecorderRef.current = recorder;
    hasStartedRef.current = true;
    chunkPartsRef.current = [];
    chunkStartAtRef.current = getNow();
    chunkIndexRef.current = 0;
    setElapsedSeconds(0);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunkPartsRef.current.push(event.data);
    };

    recorder.onstop = () => {
      flushCurrentChunk();
      if (hasStartedRef.current) {
        chunkStartAtRef.current = getNow();
        const restart = mediaRecorderRef.current;
        if (restart && restart.state === "inactive") restart.start();
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
    uiTimerRef.current = window.setInterval(
      () => setElapsedSeconds((current) => current + 1),
      1000,
    );
  }, [flushCurrentChunk, scheduleChunkFlush]);

  const pauseRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Pausing,
    }));
    clearTimers();
    hasStartedRef.current = false;
    recorder.stop();
    stopStream();
    mediaRecorderRef.current = null;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Paused,
    }));
  }, [clearTimers, stopStream]);

  const resumeRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const stopRecording = useCallback(async () => {
    clearTimers();
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      hasStartedRef.current = false;
      mediaRecorderRef.current.stop();
    }
    stopStream();
    mediaRecorderRef.current = null;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Idle,
    }));
    setElapsedSeconds(0);
  }, [clearTimers, stopStream]);

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
      transcribedTexts,
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
      transcribedTexts,
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
