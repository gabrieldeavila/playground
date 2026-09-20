import {
  forwardRef,
  memo,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
};

export const Textarea = memo(
  forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
      {
        label,
        hint,
        error,
        id: providedId,
        className,
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
          <textarea
            ref={ref}
            id={id}
            aria-describedby={describedBy || undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              "min-h-28 w-full resize-y rounded-(--radius-md) border border-border-strong bg-surface",
              "px-3.5 py-3 text-sm text-text outline-none transition-[border-color,box-shadow,background-color] duration-(--transition-base)",
              "placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary-glow",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error &&
                "border-danger focus:border-danger focus:ring-danger-glow",
              className,
            )}
            {...props}
          />
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

Textarea.displayName = "Textarea";
