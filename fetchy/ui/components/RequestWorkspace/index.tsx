import { RequestWorkspaceBaseProvider } from "./context/RequestWorkspaceBaseContext";
import { RequestWorkspaceServicesProvider } from "./context/RequestWorkspaceServicesContext";
import RequestWorkspaceContent from "./features/content";
import "./features/css/style.css";

const RequestWorkspace = () => {
  return (
    <RequestWorkspaceBaseProvider>
      <RequestWorkspaceServicesProvider>
        <RequestWorkspaceContent />
      </RequestWorkspaceServicesProvider>
    </RequestWorkspaceBaseProvider>
  );
};

export default RequestWorkspace;
