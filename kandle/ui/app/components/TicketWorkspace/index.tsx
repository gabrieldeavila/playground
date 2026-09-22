import { TicketWorkspaceBaseProvider } from "./context/TicketWorkspaceBaseContext";
import TicketWorkspaceContent from "./features/content";

const TicketWorkspace = () => {
  return (
    <TicketWorkspaceBaseProvider>
      <TicketWorkspaceContent />
    </TicketWorkspaceBaseProvider>
  );
};

export default TicketWorkspace;
