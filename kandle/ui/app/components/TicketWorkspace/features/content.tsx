import { memo } from "react";

import StockChart from "../../StockChart";
import TicketNavbar from "./TicketNavbar";

const TicketWorkspaceContent = memo(() => {
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-bg">
      <TicketNavbar />
      <section
        aria-label="Visualização dos tickets"
        className="h-[calc(100dvh-113px)] min-h-96"
      >
        <StockChart />
      </section>
    </div>
  );
});

TicketWorkspaceContent.displayName = "TicketWorkspaceContent";

export default TicketWorkspaceContent;
