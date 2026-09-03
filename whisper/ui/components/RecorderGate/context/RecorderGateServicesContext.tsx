import type { RecorderGateServicesContextValue } from "@/types/interface/recordergate-context.interface";
import { createContext, useContext } from "react";

export const RecorderGateServicesContext =
  createContext<RecorderGateServicesContextValue | null>(null);

export const useRecorderGateServicesContext = () => {
  const context = useContext(RecorderGateServicesContext);

  if (!context) {
    throw new Error(
      "useRecorderGateServicesContext must be used within a RecorderGateServicesContext",
    );
  }

  return context;
};
