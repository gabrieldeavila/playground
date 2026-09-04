import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_RECORDER_CHUNK_SIZE_SECONDS } from "~types/consts/audio-recorder.const";
import { AudioRecorderStatusEnum } from "~types/enum/audio-recorder-status.enum";
import { createRecorderSession } from "@/helpers/recording/createRecorderSession";
import { getSupportedMimeType } from "@/helpers/recording/getSupportedMimeType";
import { uploadAudioChunk } from "@/helpers/api/uploadAudioChunk";
import {
  saveRecordingText,
  getRecordingById,
} from "@/helpers/recording/recordingStorage";
import type {
  AudioChunk,
  AudioRecorderSession,
} from "~types/interface/audio-recorder.interface";
import { useRecorderGateBaseContext } from "@/components/RecorderGate/context/context";

const getNow = () => Date.now();

type UploadAudioChunkResponse = {
  text?: string;
};

export function useAudioRecorder() {
  const [session, setSession] = useState<AudioRecorderSession>(
    createRecorderSession(),
  );
  const { selectedRecordingId } = useRecorderGateBaseContext();
  const [pendingChunks, setPendingChunks] = useState<AudioChunk[]>([]);
  const [transcribedTexts, setTranscribedTexts] = useState<string[]>([]);
  const [audioChunks, setAudioChunks] = useState<AudioChunk[]>([]);
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
  const recordingTypeRef = useRef<"microphone" | "computer-audio" | null>(null);
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
    link.download = `chunk-${chunk.index + 1}.webm`;
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
    setAudioChunks((current) => [...current, chunk]);

    try {
      const response = (await uploadAudioChunk(
        chunk,
      )) as UploadAudioChunkResponse | null;
      const text = response?.text;
      if (typeof text === "string") {
        setTranscribedTexts((current) => [...current, text]);
        if (selectedRecordingId) {
          saveRecordingText(selectedRecordingId, text);
        }
        setAudioChunks((current) =>
          current.map((audioChunk) =>
            audioChunk.id === chunk.id
              ? { ...audioChunk, text, status: "sent" }
              : audioChunk,
          ),
        );
      } else {
        setAudioChunks((current) =>
          current.map((audioChunk) =>
            audioChunk.id === chunk.id
              ? { ...audioChunk, status: "sent" }
              : audioChunk,
          ),
        );
      }
    } catch (error) {
      setAudioChunks((current) =>
        current.map((audioChunk) =>
          audioChunk.id === chunk.id
            ? {
                ...audioChunk,
                status: "failed",
                errorMessage:
                  error instanceof Error
                    ? error.message
                    : "Falha ao enviar áudio",
              }
            : audioChunk,
        ),
      );
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
    recordingTypeRef.current = null;
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

    const recordingId = selectedRecordingId;
    if (!recordingId) {
      setLastError("Nenhuma gravação selecionada");
      return;
    }

    const recording = await getRecordingById(recordingId);
    if (!recording) {
      setLastError("Gravação não encontrada");
      return;
    }

    console.log(recording.type);

    const recordingType =
      recording.type === "audio" ? "microphone" : "computer-audio";
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
    console.log(recordingType);

    let stream: MediaStream;
    try {
      if (recordingType === "microphone") {
        if (!navigator.mediaDevices?.getUserMedia) {
          setIsSupported(false);
          setLastError("Navegador sem suporte a captura de microfone");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          setIsSupported(false);
          setLastError("Navegador sem suporte a captura de tela/áudio");
          return;
        }
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      }
    } catch {
      setLastError(
        recordingType === "microphone"
          ? "Não foi possível acessar o microfone"
          : "Não foi possível acessar a captura de tela/áudio",
      );
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (!audioTracks.length) {
      stream.getTracks().forEach((track) => track.stop());
      setLastError(
        recordingType === "microphone"
          ? "Nenhuma trilha de áudio foi capturada do microfone"
          : "Nenhuma trilha de áudio foi capturada na janela compartilhada",
      );
      return;
    }

    console.log(recordingType);

    setHasPermission(true);
    mediaStreamRef.current = stream;
    mimeTypeRef.current = audioMimeType;
    recordingTypeRef.current = recordingType;

    const newSessionId = recordingId;
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
    setAudioChunks([]);
    setPendingChunks([]);

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
      pendingChunks: audioChunks,
      lastError,
      elapsedSeconds,
      isSupported,
      hasPermission,
      transcribedTexts,
      setTranscribedTexts,
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
