import { memo } from "react";
import { FiSearch, FiSliders } from "react-icons/fi";

import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import { TICKET_TIME_RANGE_OPTIONS } from "@/types/consts/ticket-time-range-options.const";
import { useTicketWorkspaceContext } from "../context/context";

const TicketNavbar = memo(() => {
  const { ticketQuery, timeRange, setTicketQuery, setTimeRange } =
    useTicketWorkspaceContext();

  return (
    <nav
      aria-label="Filtros de tickets"
      className="relative z-10 flex flex-col gap-4 border-b border-border bg-bg-elevated/90 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:px-8"
    >
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Central de tickets
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
        <Input
          aria-label="Pesquisar tickets"
          className="min-w-0 sm:w-72"
          leftIcon={<FiSearch />}
          onChange={(event) => setTicketQuery(event.target.value)}
          placeholder="Pesquisar por título ou ID"
          type="search"
          value={ticketQuery}
        />
        <Select
          aria-label="Tempo de visualização dos tickets"
          className="sm:w-36"
          onChange={(event) =>
            setTimeRange(event.target.value as typeof timeRange)
          }
          value={timeRange}
        >
          {TICKET_TIME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </nav>
  );
});

TicketNavbar.displayName = "TicketNavbar";

export default TicketNavbar;
