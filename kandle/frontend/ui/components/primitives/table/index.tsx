import {
  forwardRef,
  memo,
  type TableHTMLAttributes,
  type HTMLAttributes,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type TableProps = TableHTMLAttributes<HTMLTableElement>;
export type TableSectionProps = HTMLAttributes<HTMLTableSectionElement>;
export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;
export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;
export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

const TableRoot = forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  ),
);

TableRoot.displayName = "Table";

const TableHeader = memo(
  forwardRef<HTMLTableSectionElement, TableSectionProps>(
    ({ className, ...props }, ref) => (
      <thead
        ref={ref}
        className={cn("border-b border-(--color-border)", className)}
        {...props}
      />
    ),
  ),
);

TableHeader.displayName = "Table.Header";

const TableBody = memo(
  forwardRef<HTMLTableSectionElement, TableSectionProps>(
    ({ className, ...props }, ref) => (
      <tbody
        ref={ref}
        className={cn("[&_tr:last-child]:border-0", className)}
        {...props}
      />
    ),
  ),
);

TableBody.displayName = "Table.Body";

const TableFooter = memo(
  forwardRef<HTMLTableSectionElement, TableSectionProps>(
    ({ className, ...props }, ref) => (
      <tfoot
        ref={ref}
        className={cn(
          "border-t border-(--color-border) font-medium",
          className,
        )}
        {...props}
      />
    ),
  ),
);

TableFooter.displayName = "Table.Footer";

const TableRow = memo(
  forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, ...props }, ref) => (
      <tr
        ref={ref}
        className={cn(
          "border-b border-(--color-border) transition-colors hover:bg-(--color-surface-2)",
          className,
        )}
        {...props}
      />
    ),
  ),
);

TableRow.displayName = "Table.Row";

const TableHead = memo(
  forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, ...props }, ref) => (
      <th
        ref={ref}
        className={cn(
          "h-11 px-4 text-left align-middle font-medium text-(--color-text-muted)",
          className,
        )}
        {...props}
      />
    ),
  ),
);

TableHead.displayName = "Table.Head";

const TableCell = memo(
  forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, ...props }, ref) => (
      <td
        ref={ref}
        className={cn("p-4 align-middle text-(--color-text)", className)}
        {...props}
      />
    ),
  ),
);

TableCell.displayName = "Table.Cell";

const TableCaption = memo(
  forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
    ({ className, ...props }, ref) => (
      <caption
        ref={ref}
        className={cn("mt-4 text-sm text-(--color-text-muted)", className)}
        {...props}
      />
    ),
  ),
);

TableCaption.displayName = "Table.Caption";

export const Table = Object.assign(memo(TableRoot), {
  Header: TableHeader,
  Body: TableBody,
  Footer: TableFooter,
  Row: TableRow,
  Head: TableHead,
  Cell: TableCell,
  Caption: TableCaption,
});

Table.displayName = "Table";
