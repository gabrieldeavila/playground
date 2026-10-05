import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AUDIO_RECORDER_CHUNK_SIZE_SECONDS } from "~types/consts/audio-recorder.const";
import { AudioRecorderStatusEnum } from "~types/enum/audio-recorder-status.enum";
import { createRecorderSession } from "@/helpers/recording/createRecorderSession";
import {
  getExtensionForMimeType,
  getSupportedMimeType,
} from "@/helpers/recording/getSupportedMimeType";
import { uploadAudioChunk } from "@/helpers/api/uploadAudioChunk";
import {
  saveRecordingText,
  getRecordingById,
} from "@/helpers/recording/recordingStorage";
import type {
  AudioChunk,
  AudioRecorderSession,
} from "~types/interface/audio-recorder.interface";
import type { RecordingText } from "~types/interface/recording.interface";
import { useRecorderGateBaseContext } from "@/components/RecorderGate/context/context";

const getNow = () => Date.now();

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Falha ao enviar áudio";

export function useAudioRecorder() {
  const [session, setSession] = useState<AudioRecorderSession>(
    createRecorderSession,
  );
  const { selectedRecordingId } = useRecorderGateBaseContext();
  const [chunks, setChunks] = useState<AudioChunk[]>([]);
  const [transcripts, setTranscripts] = useState<RecordingText[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<AudioChunk[]>([]);
  const chunkPartsRef = useRef<BlobPart[]>([]);
  const chunkIndexRef = useRef(0);
  // Recorded time of the current chunk, excluding pauses: time accumulated in
  // finished segments plus the segment running since `segmentStartedAtRef`.
  const chunkRecordedMsRef = useRef(0);
  const segmentStartedAtRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const mimeTypeRef = useRef("");
  // The recording a capture was started for; chunks always belong to it.
  const recordingIdRef = useRef<string | null>(null);
  const isCapturingRef = useRef(false);

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  const getChunkDurationMs = useCallback(() => {
    const segmentStartedAt = segmentStartedAtRef.current;
    return (
      chunkRecordedMsRef.current +
      (segmentStartedAt === null ? 0 : getNow() - segmentStartedAt)
    );
  }, []);

  const closeSegment = useCallback(() => {
    chunkRecordedMsRef.current = getChunkDurationMs();
    segmentStartedAtRef.current = null;
  }, [getChunkDurationMs]);

  const clearTickTimer = useCallback(() => {
    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    tickTimerRef.current = null;
  }, []);

  const stopStream = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const finishCapture = useCallback(() => {
    isCapturingRef.current = false;
    clearTickTimer();
    stopStream();
    mediaRecorderRef.current = null;
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Idle,
    }));
    setElapsedSeconds(0);
  }, [clearTickTimer, stopStream]);

  const updateChunk = useCallback(
    (chunkId: string, patch: Partial<AudioChunk>) => {
      setChunks((current) =>
        current.map((chunk) =>
          chunk.id === chunkId ? { ...chunk, ...patch } : chunk,
        ),
      );
    },
    [],
  );

  const uploadChunk = useCallback(
    async (chunk: AudioChunk) => {
      updateChunk(chunk.id, { status: "uploading", errorMessage: undefined });

      try {
        const response = await uploadAudioChunk(chunk);
        const text = response?.text?.trim() ?? "";
        updateChunk(chunk.id, { status: "sent", text });

        if (!text) return;

        // Use the chunk's timestamp so a chunk that succeeds on retry still
        // lands in recording order.
        const transcript = await saveRecordingText(
          chunk.recordingId,
          text,
          chunk.createdAt,
        );
        setTranscripts((current) =>
          [...current, transcript].sort((a, b) => a.createdAt - b.createdAt),
        );
      } catch (error) {
        const message = getErrorMessage(error);
        updateChunk(chunk.id, { status: "failed", errorMessage: message });
        setLastError(message);
      }
    },
    [updateChunk],
  );

  const flushChunk = useCallback(() => {
    const recordingId = recordingIdRef.current;
    if (chunkPartsRef.current.length === 0 || !recordingId) return;

    const chunk: AudioChunk = {
      id: crypto.randomUUID(),
      recordingId,
      index: chunkIndexRef.current,
      blob: new Blob(chunkPartsRef.current, { type: mimeTypeRef.current }),
      durationMs: Math.max(1, getChunkDurationMs()),
      createdAt: getNow(),
      status: "pending",
    };

    chunkIndexRef.current += 1;
    chunkPartsRef.current = [];
    chunkRecordedMsRef.current = 0;
    segmentStartedAtRef.current = null;
    setChunks((current) => [...current, chunk]);
    void uploadChunk(chunk);
  }, [getChunkDurationMs, uploadChunk]);

  const downloadChunk = useCallback((chunk: AudioChunk) => {
    const url = URL.createObjectURL(chunk.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chunk-${chunk.index + 1}.${getExtensionForMimeType(chunk.blob.type)}`;
    link.click();
    // Revoking synchronously cancels the download in Safari and Firefox.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const startRecording = useCallback(async () => {
    setLastError(null);

    if (typeof window === "undefined" || typeof navigator === "undefined")
      return;
    if (mediaRecorderRef.current) return;

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

    const recordingType =
      recording.type === "microphone" ? "microphone" : "computer-audio";

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setLastError("Nenhum mime type de áudio suportado encontrado");
      return;
    }

    let stream: MediaStream;
    try {
      if (recordingType === "microphone") {
        if (!navigator.mediaDevices?.getUserMedia) {
          setLastError("Navegador sem suporte a captura de microfone");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) {
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

    mediaStreamRef.current = stream;
    mimeTypeRef.current = mimeType;
    recordingIdRef.current = recordingId;

    const recorder = new MediaRecorder(new MediaStream(audioTracks), {
      mimeType,
    });
    mediaRecorderRef.current = recorder;
    isCapturingRef.current = true;
    chunkPartsRef.current = [];
    chunkRecordedMsRef.current = 0;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunkPartsRef.current.push(event.data);
    };

    // Each chunk is a separate start/stop so it is a standalone, decodable
    // file. After a rotation, keep capturing on the same stream; if the stream
    // ended (e.g. the user clicked "stop sharing"), wrap up the capture.
    recorder.onstop = () => {
      flushChunk();
      if (!isCapturingRef.current) return;

      if (recorder.stream.active) {
        segmentStartedAtRef.current = getNow();
        recorder.start();
      } else {
        finishCapture();
      }
    };

    segmentStartedAtRef.current = getNow();
    recorder.start();
    setSession({
      ...createRecorderSession(),
      id: recordingId,
      startedAt: getNow(),
      status: AudioRecorderStatusEnum.Recording,
    });
    setElapsedSeconds(0);
    tickTimerRef.current = window.setInterval(() => {
      if (recorder.state !== "recording") return;

      setElapsedSeconds((current) => current + 1);
      if (getChunkDurationMs() >= AUDIO_RECORDER_CHUNK_SIZE_SECONDS * 1000) {
        recorder.stop();
      }
    }, 1000);
  }, [selectedRecordingId, flushChunk, finishCapture, getChunkDurationMs]);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state !== "recording") return;

    recorder.pause();
    closeSegment();
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Paused,
    }));
  }, [closeSegment]);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state !== "paused") return;

    segmentStartedAtRef.current = getNow();
    recorder.resume();
    setSession((current) => ({
      ...current,
      status: AudioRecorderStatusEnum.Recording,
    }));
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    isCapturingRef.current = false;
    // stop() emits the remaining data and then `onstop`, which flushes the
    // last chunk; the tracks can be released right away.
    if (recorder && recorder.state !== "inactive") recorder.stop();
    finishCapture();
  }, [finishCapture]);

  const retryChunk = useCallback(
    async (chunkId: string) => {
      const chunk = chunksRef.current.find((item) => item.id === chunkId);
      if (!chunk || chunk.status !== "failed") return;

      setLastError(null);
      await uploadChunk(chunk);
    },
    [uploadChunk],
  );

  useEffect(
    () => () => {
      // Leaving the page mid-capture still sends the audio recorded so far.
      isCapturingRef.current = false;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      clearTickTimer();
      stopStream();
    },
    [clearTickTimer, stopStream],
  );

  return useMemo(
    () => ({
      session,
      chunks,
      lastError,
      elapsedSeconds,
      transcripts,
      setTranscripts,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      downloadChunk,
    }),
    [
      session,
      chunks,
      lastError,
      elapsedSeconds,
      transcripts,
      startRecording,
      pauseRecording,
      resumeRecording,
      stopRecording,
      retryChunk,
      downloadChunk,
    ],
  );
}
