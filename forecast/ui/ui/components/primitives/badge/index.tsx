import { memo, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/ui/helpers/cn";

export type BadgeVariant =
  "default" | "success" | "warning" | "danger" | "info";

export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  showIndicator?: boolean;
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "min-h-6 gap-1 px-(--space-2) py-(--space-1) text-xs",
  md: "min-h-7 gap-1.5 px-(--space-2) py-(--space-1) text-sm",
  lg: "min-h-8 gap-2 px-(--space-3) py-(--space-1) text-base",
};

const indicatorSizeClasses: Record<BadgeSize, string> = {
  sm: "size-1",
  md: "size-1.5",
  lg: "size-2",
};

const variantClasses: Record<BadgeVariant, string> = {
  default: cn(
    "[--badge-accent:var(--color-text-muted)]",
    "border-border-strong bg-[linear-gradient(180deg,var(--color-surface-2),var(--color-surface))] text-text-muted",
  ),
  success: cn(
    "[--badge-accent:var(--color-success)]",
    "border-[color-mix(in_srgb,var(--color-success)_38%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] text-success",
  ),
  warning: cn(
    "[--badge-accent:var(--color-warning)]",
    "border-[color-mix(in_srgb,var(--color-warning)_38%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-surface))] text-warning",
  ),
  danger: cn(
    "[--badge-accent:var(--color-danger)]",
    "border-[color-mix(in_srgb,var(--color-danger)_38%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-surface))] text-danger",
  ),
  info: cn(
    "[--badge-accent:var(--color-primary)]",
    "border-[color-mix(in_srgb,var(--color-primary)_38%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary",
  ),
};

export const Badge = memo(
  ({
    children,
    variant = "default",
    size = "md",
    showIndicator = false,
    className,
    ...props
  }: BadgeProps) => {
    return (
      <span
        {...props}
        className={cn(
          "inline-flex items-center rounded-(--button-radius) border",
          "font-sans font-medium leading-none tracking-[0.02em]",
          "shadow-(--button-shadow)",
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
      >
        {showIndicator && (
          <span
            aria-hidden="true"
            className={cn(
              "relative z-10 shrink-0 rounded-full bg-(--badge-accent) shadow-[0_0_8px_var(--badge-accent)]",
              indicatorSizeClasses[size],
            )}
          />
        )}
        <span className="relative z-10">{children}</span>
      </span>
    );
  },
);

Badge.displayName = "Badge";
