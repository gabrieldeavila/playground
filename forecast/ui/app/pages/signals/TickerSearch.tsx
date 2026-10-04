import { memo, useId, useMemo, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";

import { Input } from "@/ui/components/primitives/input";
import { cn } from "@/ui/helpers/cn";
import type { TickerOption } from "./signalsApi";

const MAX_SUGGESTIONS = 8;

/** Ticker prefix matches first, then ticker or company name containing the query. */
const findSuggestions = (options: TickerOption[], query: string) => {
  const text = query.trim().toUpperCase();
  if (!text) return [];
  const rank = ({ ticker, name }: TickerOption) =>
    ticker === text
      ? 0
      : ticker.startsWith(text)
        ? 1
        : ticker.includes(text)
          ? 2
          : name?.toUpperCase().includes(text)
            ? 3
            : -1;
  return options
    .map((option) => ({ option, rank: rank(option) }))
    .filter(({ rank }) => rank >= 0)
    .sort((left, right) => left.rank - right.rank)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ option }) => option);
};

type TickerSearchProps = {
  options: TickerOption[];
  onSelect: (ticker: string) => void;
};

export const TickerSearch = memo(({ options, onSelect }: TickerSearchProps) => {
  const { t } = useTranslation("signals");
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const suggestions = useMemo(
    () => findSuggestions(options, query),
    [options, query],
  );
  const showList = open && query.trim().length > 0;

  const choose = (ticker: string) => {
    setQuery(ticker);
    setOpen(false);
    onSelect(ticker);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) =>
        suggestions.length
          ? (index + step + suggestions.length) % suggestions.length
          : 0,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = suggestions[active] ?? suggestions[0];
      if (picked) choose(picked.ticker);
      else if (query.trim()) choose(query.trim().toUpperCase());
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <Input
        aria-label={t("search")}
        placeholder={t("search")}
        leftIcon={<FiSearch aria-hidden="true" />}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={
          showList && suggestions[active]
            ? `${listId}-${suggestions[active].ticker}`
            : undefined
        }
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) py-1 shadow-(--shadow-md)"
        >
          {suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-(--color-text-muted)">
              {t("searchNoMatch", { query: query.trim().toUpperCase() })}
            </li>
          ) : (
            suggestions.map((option, index) => (
              <li
                key={option.ticker}
                id={`${listId}-${option.ticker}`}
                role="option"
                aria-selected={index === active}
                // mousedown keeps focus so onBlur does not close the list first
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option.ticker);
                }}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-baseline gap-3 px-4 py-2 text-sm",
                  index === active && "bg-(--color-surface-2)",
                )}
              >
                <span className="w-14 shrink-0 font-semibold">
                  {option.ticker}
                </span>
                <span className="truncate text-(--color-text-muted)">
                  {option.name ?? "—"}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
});

TickerSearch.displayName = "TickerSearch";
