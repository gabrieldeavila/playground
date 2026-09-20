import {
  memo,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: DividerOrientation;
  children?: ReactNode;
};

export const Divider = memo(
  ({
    orientation = "horizontal",
    children,
    className,
    role = "separator",
    style,
    ...props
  }: DividerProps) => {
    const isHorizontal = orientation === "horizontal";
    const hasLabel = children != null;
    const geometryStyle: CSSProperties = {
      display: hasLabel ? "flex" : "block",
      flex: "0 0 auto",
      minWidth: "1px",
      minHeight: "1px",
      width: isHorizontal ? "100%" : "1px",
      height: isHorizontal ? (hasLabel ? "auto" : "1px") : "100%",
      ...style,
    };

    const lineClassName = "block min-h-px min-w-px flex-1 bg-border-strong";

    return (
      <div
        {...props}
        role={role}
        aria-orientation={orientation}
        style={geometryStyle}
        className={cn(
          "shrink-0 text-text-muted",
          isHorizontal
            ? "w-full flex-row items-center"
            : "h-full flex-col items-center",
          !hasLabel && "bg-border-strong",
          className,
        )}
      >
        {hasLabel ? (
          <>
            <span className={lineClassName} aria-hidden="true" />
            <span
              className={cn(
                "shrink-0 bg-surface px-(--space-1) font-sans text-xs leading-none tracking-[0.08em] uppercase",
                !isHorizontal && "py-(--space-1) [writing-mode:vertical-rl]",
              )}
            >
              {children}
            </span>
            <span className={lineClassName} aria-hidden="true" />
          </>
        ) : null}
      </div>
    );
  },
);

Divider.displayName = "Divider";
