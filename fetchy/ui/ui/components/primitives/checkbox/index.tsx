import {
  forwardRef,
  memo,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  description?: ReactNode;
};

export const Checkbox = memo(
  forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, id, className, ...props }, ref) => (
      <label
        className={cn(
          "inline-flex items-start gap-3 text-sm text-text",
          props.disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-(--radius-xs) border border-border-strong bg-surface text-transparent transition-[background-color,border-color,color] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-glow"
        >
          ✓
        </span>
        <span className="grid gap-1 leading-tight">
          {label}
          {description && (
            <span className="text-xs text-text-muted">{description}</span>
          )}
        </span>
      </label>
    ),
  ),
);

Checkbox.displayName = "Checkbox";
