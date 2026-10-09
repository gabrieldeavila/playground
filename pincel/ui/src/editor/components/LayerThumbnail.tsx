import clsx from 'clsx';

interface Props {
  src: string;
  title: string;
  /** Painting currently goes here (pixels or mask of the active layer). */
  editing: boolean;
  dimmed?: boolean;
  onClick: () => void;
}

export function LayerThumbnail({ src, title, editing, dimmed, onClick }: Props) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={clsx('shrink-0 rounded-sm outline-offset-1', editing ? 'outline-2 outline-white' : 'outline-0')}
    >
      <img src={src} alt="" className={clsx('checkerboard h-8 w-10 rounded-sm object-contain', dimmed && 'opacity-40')} />
    </button>
  );
}
