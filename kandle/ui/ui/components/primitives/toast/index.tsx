import { memo, useEffect, type HTMLAttributes, type ReactNode } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import { cn } from "@/ui/helpers/cn";

export type ToastVariant = "success" | "error" | "warning" | "info";
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  duration?: number;
}

const variantConfig: Record<
  ToastVariant,
  {
    icon: typeof FiCheckCircle;
    accent: string;
    iconBackground: string;
    iconColor: string;
    glow: string;
  }
> = {
  success: {
    icon: FiCheckCircle,
    accent: "var(--color-success)",
    iconBackground:
      "color-mix(in srgb, var(--color-success) 14%, var(--color-surface-2))",
    iconColor: "text-success",
    glow: "color-mix(in srgb, var(--color-success) 24%, transparent)",
  },
  error: {
    icon: FiXCircle,
    accent: "var(--color-danger)",
    iconBackground:
      "color-mix(in srgb, var(--color-danger) 14%, var(--color-surface-2))",
    iconColor: "text-danger",
    glow: "color-mix(in srgb, var(--color-danger) 24%, transparent)",
  },
  warning: {
    icon: FiAlertCircle,
    accent: "var(--color-warning)",
    iconBackground:
      "color-mix(in srgb, var(--color-warning) 14%, var(--color-surface-2))",
    iconColor: "text-warning",
    glow: "color-mix(in srgb, var(--color-warning) 24%, transparent)",
  },
  info: {
    icon: FiInfo,
    accent: "var(--color-primary)",
    iconBackground:
      "color-mix(in srgb, var(--color-primary) 14%, var(--color-surface-2))",
    iconColor: "text-primary",
    glow: "color-mix(in srgb, var(--color-primary) 24%, transparent)",
  },
};

export const Toast = memo(
  ({
    variant = "info",
    title,
    description,
    action,
    onClose,
    closeLabel = "Fechar notificação",
    duration = 0,
    className,
    ...props
  }: ToastProps) => {
    useEffect(() => {
      if (!onClose || duration <= 0) return;

      const timeoutId = window.setTimeout(onClose, duration);
      return () => window.clearTimeout(timeoutId);
    }, [duration, onClose]);

    const config = variantConfig[variant];
    const Icon = config.icon;
    const hasFooter = Boolean(action || onClose);

    return (
      <div
        role={variant === "error" ? "alert" : "status"}
        aria-live={variant === "error" ? "assertive" : "polite"}
        className={cn(
          "relative isolate flex w-full max-w-md overflow-hidden rounded-(--radius-lg) border",
          "border-border-strong bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-surface-2)_94%,transparent),var(--color-bg-elevated))]",
          "text-text shadow-[var(--shadow-lg)] backdrop-blur-xl",
          "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:bg-(--toast-accent)",
          "motion-safe:animate-[toast-enter_var(--transition-base)_ease-out]",
          className,
        )}
        style={
          {
            "--toast-accent": config.accent,
            "--toast-glow": config.glow,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-8 -top-10 -z-10 size-28 rounded-full bg-(--toast-glow) blur-3xl"
        />

        <div className="flex min-w-0 flex-1 gap-3 px-4 py-4">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10",
              "bg-(--toast-icon-background) shadow-[0_0_22px_var(--toast-glow)]",
              config.iconColor,
            )}
            style={
              {
                "--toast-icon-background": config.iconBackground,
              } as React.CSSProperties
            }
          >
            <Icon size={18} strokeWidth={2.2} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <p className="pt-1 text-sm font-semibold leading-5 tracking-[-0.01em]">
                {title}
              </p>
              {onClose && (
                <button
                  type="button"
                  aria-label={closeLabel}
                  className={cn(
                    "-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-(--radius-sm)",
                    "text-text-muted transition-[background-color,color,transform] duration-(--transition-fast)",
                    "hover:bg-white/[0.07] hover:text-text active:scale-95",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  )}
                  onClick={onClose}
                >
                  <FiX aria-hidden="true" size={17} />
                </button>
              )}
            </div>

            {description && (
              <p className="mt-1 text-sm leading-5 text-text-muted">
                {description}
              </p>
            )}

            {hasFooter && action && <div className="mt-3">{action}</div>}
          </div>
        </div>

        {duration > 0 && onClose && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[toast-progress_linear] bg-(--toast-accent) opacity-70"
            style={{ animationDuration: `${duration}ms` }}
          />
        )}
      </div>
    );
  },
);

Toast.displayName = "Toast";

const toastPositionClasses: Record<ToastPosition, string> = {
  "top-left": "left-0 top-0 items-start",
  "top-center": "left-1/2 top-0 -translate-x-1/2 items-center",
  "top-right": "right-0 top-0 items-end",
  "bottom-left": "bottom-0 left-0 items-start",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-0 right-0 items-end",
};

export interface ToastViewportProps extends HTMLAttributes<HTMLDivElement> {
  position?: ToastPosition;
}

export const ToastViewport = memo(
  ({
    position = "bottom-right",
    className,
    children,
    ...props
  }: ToastViewportProps) => (
    <div
      aria-label="Notificações"
      className={cn(
        "pointer-events-none fixed z-50 flex w-full max-w-full flex-col gap-3 p-4",
        "sm:w-auto sm:min-w-80 sm:max-w-md",
        toastPositionClasses[position],
        className,
      )}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div className="pointer-events-auto w-full" key={index}>
              {child}
            </div>
          ))
        : children && (
            <div className="pointer-events-auto w-full">{children}</div>
          )}
    </div>
  ),
);

ToastViewport.displayName = "ToastViewport";
