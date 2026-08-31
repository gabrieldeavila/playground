import type { RecordingModalBaseContextValue, RecordingModalServicesContextValue } from "@/types/interface/recordingmodal-context.interface";
import { createContext, useContext } from "react";

export const RecordingModalBaseContext = createContext<RecordingModalBaseContextValue | null>(null);

export const RecordingModalServicesContext =
  createContext<RecordingModalServicesContextValue | null>(null);

export const useRecordingModalBaseContext = () => {
  const context = useContext(RecordingModalBaseContext);

  if (!context) {
    throw new Error("useRecordingModalBaseContext must be used within a RecordingModalBaseContext");
  }

  return context;
};

export const useRecordingModalServicesContext = () => {
  const context = useContext(RecordingModalServicesContext);

  if (!context) {
    throw new Error(
      "useRecordingModalServicesContext must be used within a RecordingModalServicesContext",
    );
  }

  return context;
};