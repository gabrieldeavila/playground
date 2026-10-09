interface Props {
  onExit: () => void;
}

/** Shown while painting goes to the layer mask instead of its pixels. */
export function MaskTargetBadge({ onExit }: Props) {
  return (
    <span className="flex items-center gap-2 rounded bg-amber-400/15 px-2 py-0.5 text-amber-200">
      Editing mask: black hides, white shows
      <button type="button" onClick={onExit} className="underline hover:text-white">
        back to pixels
      </button>
    </span>
  );
}
