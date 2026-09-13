import { forwardRef, memo, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/ui/helpers/cn";

export type DataListProps = HTMLAttributes<HTMLDListElement>;

export type DataListItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  label: ReactNode;
  children: ReactNode;
};

const DataListRoot = forwardRef<HTMLDListElement, DataListProps>(
  ({ className, ...props }, ref) => (
    <dl
      ref={ref}
      className={cn("divide-y divide-(--color-border)", className)}
      {...props}
    />
  ),
);

DataListRoot.displayName = "DataList";

const DataListItem = memo(
  forwardRef<HTMLDivElement, DataListItemProps>(
    ({ children, className, label, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          "grid gap-2 px-1 py-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]",
          className,
        )}
        {...props}
      >
        <dt className="text-sm text-(--color-text-muted)">{label}</dt>
        <dd className="text-sm text-(--color-text)">{children}</dd>
      </div>
    ),
  ),
);

DataListItem.displayName = "DataList.Item";

export const DataList = Object.assign(memo(DataListRoot), {
  Item: DataListItem,
});

DataList.displayName = "DataList";
