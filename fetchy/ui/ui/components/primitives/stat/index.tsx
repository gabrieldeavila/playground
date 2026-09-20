import { forwardRef, memo, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/ui/helpers/cn";

export type StatProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: ReactNode;
  value: ReactNode;
  trend?: ReactNode;
  trendDirection?: "up" | "down" | "neutral";
};

const trendClasses = {
  up: "text-(--color-success)",
  down: "text-(--color-danger)",
  neutral: "text-(--color-text-muted)",
} as const;

export const Stat = memo(
  forwardRef<HTMLDivElement, StatProps>(
    (
      { className, label, trend, trendDirection = "neutral", value, ...props },
      ref,
    ) => (
      <div
        ref={ref}
        className={cn(
          "relative space-y-3 overflow-hidden rounded-lg",
          "border border-border bg-surface",
          "p-5 shadow-(--shadow-sm) transition-shadow",
          "hover:shadow-(--shadow-md)",
          className,
        )}
        {...props}
      >
        <div className="text-sm font-medium text-text-muted">
          {label}
        </div>
        <div className="text-3xl font-semibold tracking-tight text-text">
          {value}
        </div>
        {trend ? (
          <div
            className={cn("text-sm font-medium", trendClasses[trendDirection])}
          >
            {trend}
          </div>
        ) : null}
      </div>
    ),
  ),
);

Stat.displayName = "Stat";
