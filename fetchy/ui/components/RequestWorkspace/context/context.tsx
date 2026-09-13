import type { RequestWorkspaceBaseContextValue, RequestWorkspaceServicesContextValue } from "@/types/interface/requestworkspace-context.interface";
import { createContext, useContext } from "react";

export const RequestWorkspaceBaseContext = createContext<RequestWorkspaceBaseContextValue | null>(null);

export const RequestWorkspaceServicesContext =
  createContext<RequestWorkspaceServicesContextValue | null>(null);

export const useRequestWorkspaceBaseContext = () => {
  const context = useContext(RequestWorkspaceBaseContext);

  if (!context) {
    throw new Error("useRequestWorkspaceBaseContext must be used within a RequestWorkspaceBaseContext");
  }

  return context;
};

export const useRequestWorkspaceServicesContext = () => {
  const context = useContext(RequestWorkspaceServicesContext);

  if (!context) {
    throw new Error(
      "useRequestWorkspaceServicesContext must be used within a RequestWorkspaceServicesContext",
    );
  }

  return context;
};