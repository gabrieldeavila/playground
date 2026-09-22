import {
  cloneElement,
  memo,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "@/ui/helpers/cn";

export type FormFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  children: ReactElement;
};

export const FormField = memo(
  ({
    label,
    description,
    error,
    children,
    className,
    id,
    ...props
  }: FormFieldProps) => {
    const generatedId = useId();
    // React 19 types expose props as unknown on an untyped ReactElement.
    // FormField only injects standard field attributes, so keep that contract
    // explicit without weakening the public component API.
    type FieldChildProps = {
      id?: string;
      "aria-describedby"?: string;
      "aria-invalid"?: boolean | "grammar" | "spelling" | "true" | "false";
    };
    const child = children as ReactElement<FieldChildProps>;
    const childId = child.props.id ?? id ?? generatedId;
    const descriptionId =
      childId && description ? `${childId}-description` : undefined;
    const errorId = childId && error ? `${childId}-error` : undefined;
    const describedBy = [
      child.props["aria-describedby"],
      descriptionId,
      errorId,
    ]
      .filter(Boolean)
      .join(" ");

    const enhancedChild = cloneElement(child, {
      id: childId,
      "aria-describedby": describedBy || undefined,
      "aria-invalid": error ? true : child.props["aria-invalid"],
    });

    return (
      <div className={cn("grid gap-(--space-2)", className)} {...props}>
        {label && childId ? (
          <label
            htmlFor={childId}
            className="text-sm font-medium leading-tight text-text"
          >
            {label}
          </label>
        ) : label ? (
          <div className="text-sm font-medium leading-tight text-text">
            {label}
          </div>
        ) : null}
        {enhancedChild}
        {description && (
          <p
            id={descriptionId}
            className="text-xs leading-relaxed text-text-muted"
          >
            {description}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs leading-relaxed text-danger"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";
