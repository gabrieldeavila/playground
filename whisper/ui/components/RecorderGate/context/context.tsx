import type { RecorderGateBaseContextValue, RecorderGateServicesContextValue } from "@/types/interface/recordergate-context.interface";
import { createContext, useContext } from "react";

export const RecorderGateBaseContext = createContext<RecorderGateBaseContextValue | null>(null);

export const RecorderGateServicesContext =
  createContext<RecorderGateServicesContextValue | null>(null);

export const useRecorderGateBaseContext = () => {
  const context = useContext(RecorderGateBaseContext);

  if (!context) {
    throw new Error("useRecorderGateBaseContext must be used within a RecorderGateBaseContext");
  }

  return context;
};

export const useRecorderGateServicesContext = () => {
  const context = useContext(RecorderGateServicesContext);

  if (!context) {
    throw new Error(
      "useRecorderGateServicesContext must be used within a RecorderGateServicesContext",
    );
  }

  return context;
};