import {
  createContext,
  memo,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

type TabsContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
};
const TabsContext = createContext<TabsContextValue | null>(null);

export type TabsProps = HTMLAttributes<HTMLDivElement> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

const TabsRoot = memo(
  ({ value, defaultValue, onValueChange, children, ...props }: TabsProps) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const currentValue = value ?? internalValue;
    const handleValueChange = (nextValue: string) => {
      if (value === undefined) setInternalValue(nextValue);
      onValueChange?.(nextValue);
    };
    const context = useMemo(
      () => ({ value: currentValue, onValueChange: handleValueChange }),
      [currentValue],
    );
    return (
      <TabsContext.Provider value={context}>
        <div {...props}>{children}</div>
      </TabsContext.Provider>
    );
  },
);

const TabsList = memo(
  ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-(--radius-md) border border-border bg-surface p-1",
        className,
      )}
      {...props}
    />
  ),
);

export type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};
const TabsTrigger = memo(
  ({ value, className, children, onClick, ...props }: TabsTriggerProps) => {
    const context = useContext(TabsContext);
    const selected = context?.value === value;
    return (
      <button
        {...props}
        type="button"
        role="tab"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        className={cn(
          "rounded-(--radius-sm) px-3.5 py-2 text-sm font-medium text-text-muted transition-[background-color,color] duration-(--transition-fast) hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          selected && "bg-surface-3 text-text shadow-(--shadow-sm)",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) context?.onValueChange?.(value);
        }}
      >
        {children}
      </button>
    );
  },
);

export type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};
const TabsContent = memo(
  ({ value, className, children, ...props }: TabsContentProps) => {
    const context = useContext(TabsContext);
    const id = useId();
    if (context?.value !== value) return null;
    return (
      <div
        {...props}
        id={id}
        role="tabpanel"
        tabIndex={0}
        className={cn(
          "mt-4 outline-none focus-visible:ring-2 focus-visible:ring-primary",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
TabsRoot.displayName = "Tabs";
TabsList.displayName = "Tabs.List";
TabsTrigger.displayName = "Tabs.Trigger";
TabsContent.displayName = "Tabs.Content";
export type { ReactNode };
