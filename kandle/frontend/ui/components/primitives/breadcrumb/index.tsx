import { memo, type HTMLAttributes, type ReactNode } from "react";
import { FiChevronRight, FiMoreHorizontal } from "react-icons/fi";
import { cn } from "@/ui/helpers/cn";
export type BreadcrumbItem = {
  label: ReactNode;
  href?: string;
  current?: boolean;
};
export type BreadcrumbProps = HTMLAttributes<HTMLElement> & {
  items?: BreadcrumbItem[];
  separator?: ReactNode;
  children?: ReactNode;
};
export const Breadcrumb = memo(
  ({
    items,
    separator = <FiChevronRight aria-hidden="true" size={14} />,
    className,
    children,
    ...props
  }: BreadcrumbProps) => (
    <nav
      aria-label="Breadcrumb"
      {...props}
      className={cn("text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-2 text-text-muted">
        {children ??
          items?.map((item, index) => (
            <li key={index} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn(index === 0 && "hidden")}>
                {separator}
              </span>
              {item.href && !item.current ? (
                <a
                  href={item.href}
                  className="transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={item.current ? "page" : undefined}
                  className={cn(item.current && "font-medium text-text")}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
      </ol>
    </nav>
  ),
);
const BreadcrumbItemComponent = memo(
  ({
    children,
    href,
    current = false,
    className,
    ...props
  }: HTMLAttributes<HTMLLIElement> & { href?: string; current?: boolean }) => (
    <li {...props} className={cn("flex items-center gap-2", className)}>
      {href && !current ? (
        <a href={href} className="hover:text-text">
          {children}
        </a>
      ) : (
        <span aria-current={current ? "page" : undefined}>{children}</span>
      )}
    </li>
  ),
);
export const BreadcrumbEllipsis = memo(() => (
  <span aria-label="Mais itens">
    <FiMoreHorizontal aria-hidden="true" />
  </span>
));
export const BreadcrumbItem = BreadcrumbItemComponent;
Breadcrumb.displayName = "Breadcrumb";
