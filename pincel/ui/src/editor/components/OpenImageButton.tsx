import { useRef } from 'react';
import { LuImageUp } from 'react-icons/lu';
import { IconButton } from './IconButton';

export function OpenImageButton({ onFile }: { onFile: (file: File | undefined) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <IconButton label="Open image (or drop one on the canvas)" onClick={() => input.current?.click()}>
        <LuImageUp />
      </IconButton>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </>
  );
}
