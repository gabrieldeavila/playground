import { useCallback, useState, type DragEvent } from 'react';
import { uploadImage } from '../api/pincel-api';

/**
 * Opens a photo from a file picker or a drop on the workspace. Asks first when
 * that would throw away a document with edits.
 */
export function useImageOpener(hasEdits: boolean, onError: (message: string) => void) {
  const [dragging, setDragging] = useState(false);

  const open = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      if (hasEdits && !window.confirm('Open this image? It replaces the current image and its history.')) return;
      try {
        await uploadImage(file);
      } catch (e) {
        onError(e instanceof Error ? e.message : String(e));
      }
    },
    [hasEdits, onError],
  );

  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

  const dropHandlers = {
    onDragOver: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: (event: DragEvent) => {
      if (event.currentTarget === event.target) setDragging(false);
    },
    onDrop: (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      setDragging(false);
      void open(event.dataTransfer.files[0]);
    },
  };

  return { open, dragging, dropHandlers };
}
