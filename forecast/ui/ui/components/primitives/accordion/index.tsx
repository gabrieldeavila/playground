import {
  createContext,
  memo,
  useContext,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { FiChevronDown } from "react-icons/fi";
import { cn } from "@/ui/helpers/cn";
type ContextValue = {
  value: string[];
  toggle: (value: string) => void;
  multiple: boolean;
};
const Context = createContext<ContextValue | null>(null);
export type AccordionProps = HTMLAttributes<HTMLDivElement> & {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  multiple?: boolean;
};
const Root = memo(
  ({
    value: controlled,
    defaultValue = [],
    onValueChange,
    multiple = false,
    children,
    ...props
  }: AccordionProps) => {
    const [internal, setInternal] = useState(defaultValue);
    const value = controlled ?? internal;
    const toggle = (item: string) => {
      const next = value.includes(item)
        ? value.filter((entry) => entry !== item)
        : multiple
          ? [...value, item]
          : [item];
      if (controlled === undefined) setInternal(next);
      onValueChange?.(next);
    };
    return (
      <Context.Provider value={{ value, toggle, multiple }}>
        <div {...props}>{children}</div>
      </Context.Provider>
    );
  },
);
export type AccordionItemProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};
const Item = memo(
  ({ value, className, children, ...props }: AccordionItemProps) => (
    <div
      {...props}
      className={cn("border-b border-border last:border-b-0", className)}
    >
      {children}
    </div>
  ),
);
const Trigger = memo(
  ({
    value,
    className,
    children,
    onClick,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) => {
    const context = useContext(Context);
    const open = context?.value.includes(value);
    return (
      <button
        {...props}
        type="button"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-text transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) context?.toggle(value);
        }}
      >
        {children}
        <FiChevronDown
          aria-hidden="true"
          className={cn(
            "shrink-0 transition-transform duration-(--transition-fast)",
            open && "rotate-180",
          )}
        />
      </button>
    );
  },
);
const Content = memo(
  ({
    value,
    className,
    children,
    ...props
  }: HTMLAttributes<HTMLDivElement> & { value: string }) => {
    const open = useContext(Context)?.value.includes(value);
    if (!open) return null;
    return (
      <div
        {...props}
        role="region"
        className={cn(
          "pb-4 text-sm leading-relaxed text-text-muted",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
export const Accordion = Object.assign(Root, { Item, Trigger, Content });
