import { memo, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/ui/helpers/cn";

export type IconButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "destructive";

export type IconButtonSize = "sm" | "md" | "lg";

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> & {
  label: string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
};

const variantClasses: Record<IconButtonVariant, string> = {
  primary: cn(
    "border border-white/12 bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-hover))]",
    "text-white shadow-[0_8px_18px_rgba(0,0,0,0.14)]",
    "hover:border-white/16 hover:shadow-[0_10px_20px_rgba(0,0,0,0.16)]",
  ),
  secondary: cn(
    "border border-[var(--color-border-strong)]",
    "bg-[linear-gradient(180deg,var(--color-surface-2),var(--color-surface))]",
    "text-[var(--color-text)] shadow-[0_6px_14px_rgba(0,0,0,0.1)]",
    "hover:border-white/16 hover:bg-[linear-gradient(180deg,var(--color-surface-3),var(--color-surface-2))]",
  ),
  outline: cn(
    "border border-[var(--color-primary)] bg-transparent",
    "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/[0.1]",
  ),
  ghost: cn(
    "border border-transparent bg-transparent text-[var(--color-text)]",
    "hover:border-white/8 hover:bg-white/[0.035]",
  ),
  destructive: cn(
    "border border-[rgba(255,255,255,0.22)] bg-[linear-gradient(135deg,var(--color-danger),var(--color-danger-hover))]",
    "text-white shadow-[0_8px_18px_var(--color-danger-glow)]",
    "hover:border-[rgba(255,255,255,0.34)] hover:shadow-[0_10px_22px_var(--color-danger-glow)]",
  ),
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-13 text-lg",
};

export const IconButton = memo(
  ({
    label,
    icon,
    variant = "ghost",
    size = "md",
    className,
    type = "button",
    ...props
  }: IconButtonProps) => (
    <button
      {...props}
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--button-radius)]",
        "transition-[transform,box-shadow,border-color,background-color,opacity]",
        "duration-[var(--transition-base)] ease-[var(--transition-base)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "active:translate-y-[1px] active:scale-[0.97]",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
    >
      <span aria-hidden="true" className="inline-flex shrink-0">
        {icon}
      </span>
    </button>
  ),
);

IconButton.displayName = "IconButton";
