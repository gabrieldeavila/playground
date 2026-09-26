import {
  forwardRef,
  memo,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
  description?: ReactNode;
  checkedColor?: string;
};

export const Checkbox = memo(
  forwardRef<HTMLInputElement, CheckboxProps>(
    ({ label, description, id, className, checkedColor, ...props }, ref) => (
      <label
        style={
          checkedColor
            ? ({ "--checkbox-checked-color": checkedColor } as CSSProperties)
            : undefined
        }
        className={cn(
          "inline-flex gap-1 text-sm text-text",
          description ? "items-start" : "items-center",
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
          className={cn(
            description && "mt-0.5",
            "grid size-5 shrink-0 place-items-center rounded-(--radius-xs) border border-border-strong bg-surface text-transparent transition-[background-color,border-color,color] peer-checked:border-[var(--checkbox-checked-color,var(--color-primary))] peer-checked:bg-[var(--checkbox-checked-color,var(--color-primary))] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary-glow",
          )}
        >
          ✓
        </span>
        <span className="grid gap-0.5 leading-tight">
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
