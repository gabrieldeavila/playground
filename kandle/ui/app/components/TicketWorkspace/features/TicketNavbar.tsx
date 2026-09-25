import { memo, useEffect, useRef, useState } from "react";
import { FiSearch } from "react-icons/fi";

import { Input } from "@/ui/components/primitives/input";
import { Select } from "@/ui/components/primitives/select";
import { TICKET_TIME_RANGE_OPTIONS } from "@/types/consts/ticket-time-range-options.const";
import type { HoveredCandle } from "@/types/interface/hovered-candle.interface";
import { useTickerSuggestions } from "./useTickerSuggestions";
import { useTicketWorkspaceContext } from "../context/context";

const formatCandleTime = (time: HoveredCandle["time"]) => {
  if (typeof time === "number") {
    return new Date(time * 1000).toLocaleDateString();
  }

  if (typeof time === "string") {
    return new Date(`${time}T00:00:00`).toLocaleDateString();
  }

  return `${String(time.year).padStart(4, "0")}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(value);

const TicketNavbar = memo(() => {
  const {
    ticketQuery,
    timeRange,
    hoveredCandle,
    setTicketQuery,
    setTimeRange,
    loadTicker,
  } = useTicketWorkspaceContext();
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
  const candleValues = [
    { label: "Data", value: hoveredCandle ? formatCandleTime(hoveredCandle.time) : "—" },
    { label: "Abert.", value: hoveredCandle ? formatPrice(hoveredCandle.open) : "—" },
    { label: "Fech.", value: hoveredCandle ? formatPrice(hoveredCandle.close) : "—" },
    { label: "Máx.", value: hoveredCandle ? formatPrice(hoveredCandle.high) : "—" },
    { label: "Mín.", value: hoveredCandle ? formatPrice(hoveredCandle.low) : "—" },
  ];

  return (
    <nav
      aria-label="Filtros de tickets"
      className="relative z-10 grid grid-cols-1 gap-4 border-b border-border bg-bg-elevated/90 px-5 py-4 backdrop-blur-xl sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center"
    >
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Central de tickets
        </p>
      </div>

      <dl
        aria-label="Dados do candle selecionado"
        className="grid w-full grid-cols-5 items-center rounded-(--radius-md) border border-border bg-bg/50 px-2 py-2 text-center lg:w-[640px] lg:px-4"
      >
        {!hoveredCandle && (
          <span className="sr-only">
            Passe o cursor sobre um candle para ver os preços
          </span>
        )}
        {candleValues.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-[10px] leading-4 text-text-muted sm:text-xs">
              {label}
            </dt>
            <dd className="whitespace-nowrap font-semibold tabular-nums text-text text-xs sm:text-sm">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:justify-self-end">
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
                    key={option.value}
                    role="option"
                    aria-selected={option.label === ticketQuery}
                  >
                    <button
                      className="w-full rounded-(--radius-sm) px-3 py-2 text-left text-sm text-text transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => {
                        setIsSuggestionSearchEnabled(false);
                        setTicketQuery(option.label);
                        setIsSuggestionsOpen(false);
                        void loadTicker(option.value);
                      }}
                      type="button"
                    >
                      {option.label}
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
