import { memo, type HTMLAttributes, type ReactNode } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiAlertTriangle,
} from "react-icons/fi";

import { cn } from "@/ui/helpers/cn";

export type AlertVariant =
  "default" | "info" | "success" | "warning" | "danger";

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: AlertVariant;
};

const variantClasses: Record<AlertVariant, string> = {
  default: cn(
    "border-border-strong bg-surface-2 text-text",
    "[--alert-accent:var(--color-text-muted)]",
  ),
  info: cn(
    "border-[color-mix(in_srgb,var(--color-primary)_38%,var(--color-border))]",
    "bg-[color-mix(in_srgb,var(--color-primary)_12%,var(--color-surface))] text-primary",
    "[--alert-accent:var(--color-primary)]",
  ),
  success: cn(
    "border-[color-mix(in_srgb,var(--color-success)_38%,var(--color-border))]",
    "bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] text-success",
    "[--alert-accent:var(--color-success)]",
  ),
  warning: cn(
    "border-[color-mix(in_srgb,var(--color-warning)_38%,var(--color-border))]",
    "bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-surface))] text-warning",
    "[--alert-accent:var(--color-warning)]",
  ),
  danger: cn(
    "border-[color-mix(in_srgb,var(--color-danger)_38%,var(--color-border))]",
    "bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-surface))] text-danger",
    "[--alert-accent:var(--color-danger)]",
  ),
};

const variantIcons: Record<AlertVariant, typeof FiInfo> = {
  default: FiInfo,
  info: FiInfo,
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  danger: FiAlertCircle,
};

export const Alert = memo(
  ({
    children,
    variant = "default",
    className,
    role = "alert",
    ...props
  }: AlertProps) => {
    const Icon = variantIcons[variant];

    return (
      <div
        {...props}
        role={role}
        className={cn(
          "flex items-start gap-(--space-3) rounded-md border",
          "pl-(--space-10) pr-(--space-10) py-(--space-3) font-sans text-sm leading-relaxed",
          "shadow-(--shadow-sm)",
          variantClasses[variant],
          className,
        )}
      >
        <Icon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-(--alert-accent)"
        />
        <div className="min-w-0 text-text">{children}</div>
      </div>
    );
  },
);

Alert.displayName = "Alert";
