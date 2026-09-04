import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RecordingSourceMode = "microphone" | "computer-audio";

export type RecordingModalSelectionContextValue = {
  selectedSource: RecordingSourceMode | null;
  setSelectedSource: (value: RecordingSourceMode | null) => void;
};

export const RecordingModalSelectionContext =
  createContext<RecordingModalSelectionContextValue | null>(null);

export function RecordingModalSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selectedSource, setSelectedSource] =
    useState<RecordingSourceMode | null>(null);

  const value = useMemo(
    () => ({
      selectedSource,
      setSelectedSource,
    }),
    [selectedSource],
  );

  return (
    <RecordingModalSelectionContext.Provider value={value}>
      {children}
    </RecordingModalSelectionContext.Provider>
  );
}

export function useRecordingModalSelectionContext() {
  const context = useContext(RecordingModalSelectionContext);

  if (!context) {
    throw new Error(
      "useRecordingModalSelectionContext must be used within a RecordingModalSelectionContext",
    );
  }

  return context;
}
