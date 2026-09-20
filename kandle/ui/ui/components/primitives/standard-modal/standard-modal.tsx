import { memo, useCallback } from "react";

import { Button } from "@/ui/components/primitives/button";
import { Modal } from "@/ui/components/primitives/modal";
import type { StandardModalProps } from "../modal/modal.types";

export const StandardModal = memo(
  ({
    title,
    children,
    onCancel,
    onSave,
    cancelLabel = "Cancelar",
    saveLabel = "Salvar",
    showCancelButton = true,
    showSaveButton = true,
    cancelDisabled = false,
    saveDisabled = false,
    saveLoading = false,
    size = "md",
    className,
    onOpenChange,
    ...modalProps
  }: StandardModalProps) => {
    const handleCancel = useCallback(() => {
      onCancel?.();
      onOpenChange(false);
    }, [onCancel, onOpenChange]);

    return (
      <Modal onOpenChange={onOpenChange} {...modalProps}>
        <Modal.Content size={size} className={className}>
          <Modal.Header>
            <Modal.Title>{title}</Modal.Title>
            <Modal.CloseButton onClick={() => onOpenChange(false)} />
          </Modal.Header>

          <Modal.Body>{children}</Modal.Body>

          {(showCancelButton || showSaveButton) && (
            <Modal.Footer>
              {showCancelButton && (
                <Button
                  variant="ghost"
                  disabled={cancelDisabled}
                  onClick={handleCancel}
                >
                  {cancelLabel}
                </Button>
              )}
              {showSaveButton && (
                <Button
                  disabled={saveDisabled}
                  isLoading={saveLoading}
                  onClick={onSave}
                >
                  {saveLabel}
                </Button>
              )}
            </Modal.Footer>
          )}
        </Modal.Content>
      </Modal>
    );
  },
);

export type { StandardModalProps } from "../modal/modal.types";
