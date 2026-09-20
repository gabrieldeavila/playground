import { memo, type HTMLAttributes } from "react";

import { cn } from "@/ui/helpers/cn";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: SpinnerSize;
  label?: string;
};

const sizeClasses: Record<SpinnerSize, string> = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-2",
};

export const Spinner = memo(
  ({
    size = "md",
    label = "Carregando",
    className,
    role = "status",
    ...props
  }: SpinnerProps) => (
    <span
      {...props}
      role={role}
      aria-label={label}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent",
        "motion-reduce:animate-none",
        sizeClasses[size],
        className,
      )}
    />
  ),
);

Spinner.displayName = "Spinner";
