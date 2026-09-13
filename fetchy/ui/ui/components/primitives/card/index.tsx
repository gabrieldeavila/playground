import { forwardRef, memo, type HTMLAttributes } from "react";

import { cn } from "@/ui/helpers/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;
export type CardSectionProps = HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

const CardRoot = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-(--radius-lg) border border-(--color-border)",
        "bg-(--color-surface) text-(--color-text) shadow-(--shadow-sm)",
        className,
      )}
      {...props}
    />
  ),
);

CardRoot.displayName = "Card";

const CardHeader = memo(
  forwardRef<HTMLDivElement, CardSectionProps>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1.5 p-5", className)}
        {...props}
      />
    ),
  ),
);

CardHeader.displayName = "Card.Header";

const CardTitle = memo(
  forwardRef<HTMLHeadingElement, CardTitleProps>(
    ({ className, ...props }, ref) => (
      <h3
        ref={ref}
        className={cn("text-lg font-semibold tracking-tight", className)}
        {...props}
      />
    ),
  ),
);

CardTitle.displayName = "Card.Title";

const CardBody = memo(
  forwardRef<HTMLDivElement, CardSectionProps>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn("px-5 pb-5", className)} {...props} />
    ),
  ),
);

CardBody.displayName = "Card.Body";

const CardFooter = memo(
  forwardRef<HTMLDivElement, CardSectionProps>(
    ({ className, ...props }, ref) => (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 border-t border-[var(--color-border)] px-5 py-4",
          className,
        )}
        {...props}
      />
    ),
  ),
);

CardFooter.displayName = "Card.Footer";

export const Card = Object.assign(memo(CardRoot), {
  Header: CardHeader,
  Title: CardTitle,
  Body: CardBody,
  Footer: CardFooter,
});

Card.displayName = "Card";
