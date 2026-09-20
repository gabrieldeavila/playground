import {
  forwardRef,
  memo,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
};

export const Input = memo(
  forwardRef<HTMLInputElement, InputProps>(
    (
      {
        label,
        hint,
        error,
        leftIcon,
        rightIcon,
        isLoading = false,
        id: providedId,
        className,
        disabled,
        "aria-describedby": ariaDescribedBy,
        ...props
      },
      ref,
    ) => {
      const generatedId = useId();
      const id = providedId ?? generatedId;
      const hintId = hint ? `${id}-hint` : undefined;
      const errorId = error ? `${id}-error` : undefined;
      const describedBy = [ariaDescribedBy, hintId, errorId]
        .filter(Boolean)
        .join(" ");
      const isDisabled = disabled || isLoading;

      return (
        <div className="grid gap-(--space-2)">
          {label && (
            <label
              htmlFor={id}
              className="text-sm font-medium leading-tight text-text"
            >
              {label}
            </label>
          )}
          <div className="relative">
            {leftIcon && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-muted"
              >
                {leftIcon}
              </span>
            )}
            <input
              ref={ref}
              id={id}
              disabled={isDisabled}
              aria-describedby={describedBy || undefined}
              aria-invalid={error ? true : undefined}
              aria-busy={isLoading || undefined}
              className={cn(
                "min-h-11 w-full rounded-(--radius-md) border border-border-strong bg-surface",
                "px-3.5 py-2.5 text-sm text-text outline-none transition-[border-color,box-shadow,background-color] duration-(--transition-base)",
                "placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary-glow",
                "disabled:cursor-not-allowed disabled:opacity-50",
                leftIcon && "pl-10",
                rightIcon || isLoading ? "pr-10" : undefined,
                error &&
                  "border-danger focus:border-danger focus:ring-danger-glow",
                className,
              )}
              {...props}
            />
            {isLoading ? (
              <span
                aria-label="Carregando"
                className="absolute inset-y-0 right-3 flex items-center"
              >
                <span
                  aria-hidden="true"
                  className="size-4 animate-spin rounded-full border-2 border-primary border-r-transparent"
                />
              </span>
            ) : rightIcon ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-text-muted"
              >
                {rightIcon}
              </span>
            ) : null}
          </div>
          {hint && !error && (
            <p id={hintId} className="text-xs text-text-muted">
              {hint}
            </p>
          )}
          {error && (
            <p id={errorId} role="alert" className="text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      );
    },
  ),
);

Input.displayName = "Input";
