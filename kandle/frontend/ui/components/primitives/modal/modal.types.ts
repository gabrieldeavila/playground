import type { HTMLAttributes, ReactNode, ButtonHTMLAttributes } from "react";

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
}

export type ModalContentProps = HTMLAttributes<HTMLDivElement> & {
  size?: ModalSize;
};

export type ModalHeaderProps = HTMLAttributes<HTMLDivElement>;
export type ModalBodyProps = HTMLAttributes<HTMLDivElement>;
export type ModalFooterProps = HTMLAttributes<HTMLDivElement>;
export type ModalTitleProps = HTMLAttributes<HTMLHeadingElement>;

export type ModalCloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export interface StandardModalProps extends Omit<ModalProps, "children"> {
  title: ReactNode;
  children: ReactNode;
  onCancel?: () => void;
  onSave?: () => void | Promise<void>;
  cancelLabel?: string;
  saveLabel?: string;
  showCancelButton?: boolean;
  showSaveButton?: boolean;
  cancelDisabled?: boolean;
  saveDisabled?: boolean;
  saveLoading?: boolean;
  size?: ModalSize;
  className?: string;
}
