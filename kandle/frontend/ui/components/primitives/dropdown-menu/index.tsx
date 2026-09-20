import {
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { FiChevronRight } from "react-icons/fi";
import { cn } from "@/ui/helpers/cn";

type MenuContextValue = { open: boolean; setOpen: (open: boolean) => void };
const MenuContext = createContext<MenuContextValue | null>(null);
export type DropdownMenuProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
const Root = memo(
  ({
    children,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
  }: DropdownMenuProps) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = controlledOpen ?? uncontrolledOpen;
    const setOpen = (next: boolean) => {
      if (controlledOpen === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    return (
      <MenuContext.Provider value={{ open, setOpen }}>
        <div className="relative inline-flex">{children}</div>
      </MenuContext.Provider>
    );
  },
);
const Trigger = memo(
  ({
    className,
    children,
    onClick,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => {
    const context = useContext(MenuContext);
    return (
      <button
        {...props}
        type="button"
        aria-haspopup="menu"
        aria-expanded={context?.open}
        className={cn(
          "inline-flex items-center gap-2 rounded-(--radius-md) border border-border-strong bg-surface px-3.5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) context?.setOpen(!context.open);
        }}
      >
        {children}
      </button>
    );
  },
);
const Content = memo(
  ({
    className,
    children,
    align = "start",
    ...props
  }: HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) => {
    const context = useContext(MenuContext);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!context?.open) return;
      const close = (event: MouseEvent) => {
        if (!ref.current?.contains(event.target as Node))
          context.setOpen(false);
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [context]);
    if (!context?.open) return null;
    return (
      <div
        ref={ref}
        role="menu"
        {...props}
        className={cn(
          "absolute top-[calc(100%+0.5rem)] z-50 min-w-48 rounded-(--radius-md) border border-border-strong bg-bg-elevated p-1.5 text-text shadow-(--shadow-lg)",
          align === "end" ? "right-0" : "left-0",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
const Item = memo(
  ({
    className,
    children,
    disabled,
    onClick,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => {
    const context = useContext(MenuContext);
    return (
      <button
        {...props}
        type="button"
        role="menuitem"
        disabled={disabled}
        className={cn(
          "flex w-full items-center rounded-(--radius-sm) px-3 py-2 text-left text-sm text-text transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) context?.setOpen(false);
        }}
      >
        {children}
      </button>
    );
  },
);
const Separator = memo(
  ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
      role="separator"
      className={cn("my-1 h-px bg-border", className)}
      {...props}
    />
  ),
);
const SubTrigger = memo(
  ({
    className,
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...props}
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center justify-between rounded-(--radius-sm) px-3 py-2 text-left text-sm text-text hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
    >
      {children}
      <FiChevronRight aria-hidden="true" size={15} />
    </button>
  ),
);
export const DropdownMenu = Object.assign(Root, {
  Trigger,
  Content,
  Item,
  Separator,
  SubTrigger,
});
