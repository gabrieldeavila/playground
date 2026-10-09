/** Covers the workspace while a file is dragged over it. */
export function DropOverlay() {
  return (
    <div className="pointer-events-none absolute inset-3 z-30 grid place-items-center rounded-xl border-2 border-dashed border-accent bg-accent/10 text-lg text-white">
      Drop a photo to open it
    </div>
  );
}
