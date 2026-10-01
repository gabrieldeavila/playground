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
import { cn } from "@/ui/helpers/cn";
type ContextValue = { open: boolean; setOpen: (open: boolean) => void };
const PopoverContext = createContext<ContextValue | null>(null);
export type PopoverProps = {
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
  }: PopoverProps) => {
    const [internal, setInternal] = useState(defaultOpen);
    const open = controlledOpen ?? internal;
    const setOpen = (next: boolean) => {
      if (controlledOpen === undefined) setInternal(next);
      onOpenChange?.(next);
    };
    return (
      <PopoverContext.Provider value={{ open, setOpen }}>
        <div className="relative inline-flex">{children}</div>
      </PopoverContext.Provider>
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
    const context = useContext(PopoverContext);
    return (
      <button
        {...props}
        type="button"
        aria-expanded={context?.open}
        className={cn(
          "inline-flex items-center rounded-(--radius-md) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
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
    side = "bottom",
    align = "start",
    ...props
  }: HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "bottom";
    align?: "start" | "end";
  }) => {
    const context = useContext(PopoverContext);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!context?.open) return;
      const close = (event: MouseEvent) => {
        if (!ref.current?.parentElement?.contains(event.target as Node))
          context.setOpen(false);
      };
      document.addEventListener("mousedown", close);
      return () => document.removeEventListener("mousedown", close);
    }, [context]);
    if (!context?.open) return null;
    return (
      <div
        ref={ref}
        {...props}
        className={cn(
          "absolute z-50 min-w-56 rounded-(--radius-md) border border-border-strong bg-bg-elevated p-4 text-text shadow-(--shadow-lg)",
          side === "top"
            ? "bottom-[calc(100%+0.5rem)]"
            : "top-[calc(100%+0.5rem)]",
          align === "end" ? "right-0" : "left-0",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
export const Popover = Object.assign(Root, { Trigger, Content });
