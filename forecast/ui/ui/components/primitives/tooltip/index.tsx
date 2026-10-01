import { memo, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/ui/helpers/cn";

export type TooltipProps = HTMLAttributes<HTMLSpanElement> & {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};
const sideClasses = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
  bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
};
export const Tooltip = memo(
  ({ content, children, side = "top", className, ...props }: TooltipProps) => (
    <span className={cn("group relative inline-flex", className)} {...props}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-56 rounded-(--radius-sm) border border-border-strong bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text opacity-0 shadow-(--shadow-md) transition-opacity duration-(--transition-fast) group-hover:opacity-100 group-focus-within:opacity-100",
          sideClasses[side],
        )}
      >
        {content}
      </span>
    </span>
  ),
);
Tooltip.displayName = "Tooltip";
