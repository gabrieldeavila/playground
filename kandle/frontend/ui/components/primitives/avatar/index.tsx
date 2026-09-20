import { forwardRef, memo, useState, type ImgHTMLAttributes } from "react";

import { cn } from "@/ui/helpers/cn";

export type AvatarProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "children" | "src"
> & {
  src?: string;
  fallback: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

export const Avatar = memo(
  forwardRef<HTMLImageElement, AvatarProps>(
    (
      { alt, className, fallback, size = "md", src, onError, ...props },
      ref,
    ) => {
      const [hasError, setHasError] = useState(false);
      const showFallback = !src || hasError;

      const handleError: NonNullable<AvatarProps["onError"]> = (event) => {
        setHasError(true);
        onError?.(event);
      };

      if (showFallback) {
        return (
          <span
            role="img"
            aria-label={alt || fallback}
            className={cn(
              "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
              "bg-(--color-surface-3) font-semibold text-(--color-text)",
              "ring-1 ring-inset ring-white/10",
              sizeClasses[size],
              className,
            )}
          >
            {fallback}
          </span>
        );
      }

      return (
        <img
          ref={ref}
          src={src}
          alt={alt}
          onError={handleError}
          className={cn(
            "inline-block shrink-0 rounded-full object-cover",
            "ring-1 ring-inset ring-white/10",
            sizeClasses[size],
            className,
          )}
          {...props}
        />
      );
    },
  ),
);

Avatar.displayName = "Avatar";
