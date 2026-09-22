import { memo, useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";

import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import { TICKET_TIME_RANGE_OPTIONS } from "@/types/consts/ticket-time-range-options.const";
import { useTickerSuggestions } from "./useTickerSuggestions";
import { useTicketWorkspaceContext } from "../context/context";

const TicketNavbar = memo(() => {
  const { ticketQuery, timeRange, setTicketQuery, setTimeRange } =
    useTicketWorkspaceContext();
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isSuggestionSearchEnabled, setIsSuggestionSearchEnabled] =
    useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const { suggestions: options, isLoading } = useTickerSuggestions(
    ticketQuery,
    isSuggestionSearchEnabled,
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const showSuggestions =
    isSuggestionsOpen && (isLoading || options.length > 0);

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
        <div ref={searchRef} className="relative min-w-0 sm:w-72">
          <Input
            aria-label="Pesquisar tickets"
            aria-controls="ticket-search-suggestions"
            aria-expanded={showSuggestions}
            aria-haspopup="listbox"
            className="min-w-0 sm:w-72"
            leftIcon={<FiSearch />}
            onChange={(event) => {
              setIsSuggestionSearchEnabled(true);
              setTicketQuery(event.target.value);
              setIsSuggestionsOpen(true);
            }}
            onFocus={() => setIsSuggestionsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsSuggestionsOpen(false);
            }}
            placeholder="Pesquisar por título ou ID"
            type="search"
            value={ticketQuery}
          />

          {showSuggestions && (
            <ul
              id="ticket-search-suggestions"
              aria-label="Sugestões de ativos"
              className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-64 overflow-auto rounded-(--radius-md) border border-border-strong bg-bg-elevated p-1.5 shadow-(--shadow-lg)"
              role="listbox"
            >
              {isLoading ? (
                <li className="px-3 py-2 text-sm text-text-muted" role="status">
                  Pesquisando...
                </li>
              ) : (
                options.map((option) => (
                  <li
                    key={option}
                    role="option"
                    aria-selected={option === ticketQuery}
                  >
                    <button
                      className="w-full rounded-(--radius-sm) px-3 py-2 text-left text-sm text-text transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => {
                        setIsSuggestionSearchEnabled(false);
                        setTicketQuery(option);
                        setIsSuggestionsOpen(false);
                      }}
                      type="button"
                    >
                      {option}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
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
