import type { ReactNode } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";

import { Table } from "@/ui/components/primitives/table";
import type { Sort, SortKey } from "../helpers/sort";

type SortableHeadProps = {
  column: SortKey;
  sort: Sort | null;
  onSort: (sort: Sort) => void;
  children: ReactNode;
};

/** Header cell that sorts the table: first click desc (asc for text), then flips. */
export const SortableHead = ({
  column,
  sort,
  onSort,
  children,
}: SortableHeadProps) => {
  const active = sort?.key === column;
  const direction = active
    ? sort.direction === "asc"
      ? "desc"
      : "asc"
    : column === "ticker"
      ? "asc"
      : "desc";
  return (
    <Table.Head
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-(--color-text) ${
          active ? "text-(--color-text)" : ""
        }`}
        onClick={() => onSort({ key: column, direction })}
      >
        {children}
        {active &&
          (sort.direction === "asc" ? (
            <FiArrowUp aria-hidden="true" />
          ) : (
            <FiArrowDown aria-hidden="true" />
          ))}
      </button>
    </Table.Head>
  );
};
