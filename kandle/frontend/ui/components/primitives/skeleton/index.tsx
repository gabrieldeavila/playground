import { memo, type CSSProperties, type HTMLAttributes } from "react";

import { cn } from "@/ui/helpers/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  label?: string;
};

export const Skeleton = memo(
  ({
    width = "100%",
    height = "1rem",
    label = "Carregando conteúdo",
    className,
    style,
    role = "status",
    ...props
  }: SkeletonProps) => (
    <div
      {...props}
      role={role}
      aria-label={label}
      aria-busy="true"
      className={cn(
        "animate-pulse rounded-md bg-surface-2",
        "motion-reduce:animate-none",
        className,
      )}
      style={{ ...style, width, height }}
    />
  ),
);

Skeleton.displayName = "Skeleton";
