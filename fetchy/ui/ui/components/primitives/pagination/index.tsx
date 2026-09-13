import {
  memo,
  useMemo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal,
} from "react-icons/fi";
import { cn } from "@/ui/helpers/cn";
export type PaginationProps = Omit<HTMLAttributes<HTMLElement>, "onChange"> & {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  previousLabel?: string;
  nextLabel?: string;
};
const getPages = (page: number, total: number, sibling: number) => {
  const range = (from: number, to: number) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index);
  const totalVisible = sibling * 2 + 5;
  if (total <= totalVisible) return range(1, total);
  const left = Math.max(page - sibling, 1);
  const right = Math.min(page + sibling, total);
  const pages: (number | "ellipsis-left" | "ellipsis-right")[] = [];
  if (left > 2) pages.push(1, "ellipsis-left");
  else pages.push(...range(1, left));
  pages.push(...range(Math.max(left, 2), Math.min(right, total - 1)));
  if (right < total - 1) pages.push("ellipsis-right", total);
  else if (right < total) pages.push(...range(right, total));
  return [...new Set(pages)];
};
const PageButton = ({
  className,
  active,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
  <button
    {...props}
    type="button"
    className={cn(
      "inline-flex size-9 items-center justify-center rounded-(--radius-sm) text-sm text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-40",
      active && "bg-primary text-white hover:bg-primary-hover hover:text-white",
      className,
    )}
  />
);
export const Pagination = memo(
  ({
    page,
    totalPages,
    onPageChange,
    siblingCount = 1,
    previousLabel = "Página anterior",
    nextLabel = "Próxima página",
    className,
    ...props
  }: PaginationProps) => {
    const pages = useMemo(
      () => getPages(page, totalPages, siblingCount),
      [page, totalPages, siblingCount],
    );
    if (totalPages < 1) return null;
    return (
      <nav
        aria-label="Paginação"
        {...props}
        className={cn("flex items-center gap-1", className)}
      >
        <PageButton
          aria-label={previousLabel}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <FiChevronLeft aria-hidden="true" />
        </PageButton>
        {pages.map((item, index) =>
          typeof item === "string" ? (
            <span
              key={`${item}-${index}`}
              className="inline-flex size-9 items-center justify-center text-text-muted"
            >
              <FiMoreHorizontal aria-hidden="true" />
            </span>
          ) : (
            <PageButton
              key={item}
              active={item === page}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </PageButton>
          ),
        )}
        <PageButton
          aria-label={nextLabel}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <FiChevronRight aria-hidden="true" />
        </PageButton>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";
