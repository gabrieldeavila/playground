import type { RecorderGateBaseContextValue } from "@/types/interface/recordergate-context.interface";
import { createContext, useContext } from "react";

export const RecorderGateBaseContext =
  createContext<RecorderGateBaseContextValue | null>(null);

export const useRecorderGateBaseContext = () => {
  const context = useContext(RecorderGateBaseContext);

  if (!context) {
    throw new Error(
      "useRecorderGateBaseContext must be used within a RecorderGateBaseContext",
    );
  }

  return context;
};
