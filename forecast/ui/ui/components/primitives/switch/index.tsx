import {
  forwardRef,
  memo,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type SwitchProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
};

export const Switch = memo(
  forwardRef<HTMLInputElement, SwitchProps>(
    ({ label, className, id, ...props }, ref) => (
      <label
        className={cn(
          "inline-flex items-center gap-3 text-sm text-text",
          props.disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          id={id}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 rounded-full bg-surface-3 transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary-glow after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
        />
        {label}
      </label>
    ),
  ),
);

Switch.displayName = "Switch";
