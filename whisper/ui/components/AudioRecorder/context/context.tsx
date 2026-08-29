import { createContext, useContext } from "react";
import type { AudioRecorderBaseContextValue, AudioRecorderServicesContextValue } from "~types/interface/audio-recorder.interface";

export const AudioRecorderBaseContext =
  createContext<AudioRecorderBaseContextValue | null>(null);
export const AudioRecorderServicesContext =
  createContext<AudioRecorderServicesContextValue | null>(null);

export const useAudioRecorderBaseContext = () => {
  const context = useContext(AudioRecorderBaseContext);
  if (!context)
    throw new Error(
      "useAudioRecorderBaseContext must be used within a AudioRecorderBaseContext",
    );
  return context;
};

export const useAudioRecorderServicesContext = () => {
  const context = useContext(AudioRecorderServicesContext);
  if (!context)
    throw new Error(
      "useAudioRecorderServicesContext must be used within a AudioRecorderServicesContext",
    );
  return context;
};
