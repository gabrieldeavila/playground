import { FiX } from "react-icons/fi";
import {
  memo,
  useEffect,
  useId,
  type KeyboardEvent,
} from "react";

import { cn } from "@/ui/helpers/cn";

import type {
  ModalBodyProps,
  ModalCloseButtonProps,
  ModalContentProps,
  ModalFooterProps,
  ModalHeaderProps,
  ModalProps,
  ModalTitleProps,
} from "./modal.types";
import { createPortal } from "react-dom";

const contentSizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const ModalRoot = memo(
  ({
    open,
    onOpenChange,
    children,
    closeOnBackdropClick = true,
    closeOnEscape = true,
  }: ModalProps) => {
    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (closeOnEscape && event.key === "Escape") {
          onOpenChange(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = previousOverflow;
      };
    }, [closeOnEscape, onOpenChange, open]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex min-h-dvh items-center justify-center overflow-y-auto p-4 sm:p-6">
        <button
          type="button"
          aria-label="Fechar modal"
          className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-[2px] transition-opacity duration-(--transition-base) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-inset"
          onClick={() => {
            if (closeOnBackdropClick) onOpenChange(false);
          }}
        />
        <div className="relative z-10 w-full motion-safe:animate-[modal-enter_var(--transition-base)_ease-out]">
          {children}
        </div>
      </div>,
      document.body,
    );
  },
);

const ModalContent = memo(
  ({ size = "md", className, onClick, ...props }: ModalContentProps) => (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "mx-auto flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden",
        "rounded-lg border border-border-strong",
        "bg-[linear-gradient(180deg,var(--color-bg-elevated),var(--color-surface))]",
        "text-text shadow-(--shadow-lg)",
        "outline-none",
        contentSizeClasses[size],
        className,
      )}
      onClick={onClick}
      {...props}
    />
  ),
);

const ModalHeader = memo(({ className, ...props }: ModalHeaderProps) => (
  <div
    className={cn(
      "flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-5",
      className,
    )}
    {...props}
  />
));

const ModalBody = memo(({ className, ...props }: ModalBodyProps) => (
  <div
    className={cn("min-h-0 flex-1 overflow-y-auto p-6", className)}
    {...props}
  />
));

const ModalFooter = memo(({ className, ...props }: ModalFooterProps) => (
  <div
    className={cn(
      "flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4",
      className,
    )}
    {...props}
  />
));

const ModalTitle = memo(({ className, ...props }: ModalTitleProps) => (
  <h2
    className={cn("text-lg font-semibold tracking-[-0.02em]", className)}
    {...props}
  />
));

const ModalCloseButton = memo(
  ({
    className,
    onClick,
    type = "button",
    ...props
  }: ModalCloseButtonProps) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
    };

    return (
      <button
        type={type}
        aria-label="Fechar modal"
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-sm",
          "text-text-muted transition-[background-color,color,transform] duration-(--transition-fast)",
          "hover:bg-white/6 hover:text-text active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary)",
          className,
        )}
        onClick={handleClick}
        {...props}
      >
        <FiX aria-hidden="true" size={19} />
      </button>
    );
  },
);

const ModalTitleWithId = memo((props: ModalTitleProps) => {
  const generatedId = useId();
  return <ModalTitle {...props} id={props.id ?? generatedId} />;
});

export const Modal = Object.assign(ModalRoot, {
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Title: ModalTitleWithId,
  CloseButton: ModalCloseButton,
});

export type { KeyboardEvent };
