import { memo, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/ui/helpers/cn";

export type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export const EmptyState = memo(
  ({
    icon,
    title,
    description,
    action,
    className,
    role = "status",
    ...props
  }: EmptyStateProps) => (
    <div
      {...props}
      role={role}
      className={cn(
        "flex w-full flex-col items-center justify-center text-center",
        "rounded-[var(--radius-lg)] border border-[var(--color-border)]",
        "bg-[var(--color-surface)] px-6 py-10",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="mb-4 inline-flex text-4xl text-[var(--color-text-muted)]"
        >
          {icon}
        </div>
      )}

      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  ),
);

EmptyState.displayName = "EmptyState";
