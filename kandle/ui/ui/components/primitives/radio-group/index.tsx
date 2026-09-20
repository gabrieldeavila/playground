import { memo, useId, type ChangeEvent, type ReactNode } from "react";

import { cn } from "@/ui/helpers/cn";

export type RadioOption = {
  label: ReactNode;
  value: string;
  disabled?: boolean;
};
export type RadioGroupProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: RadioOption[];
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: ReactNode;
  className?: string;
};

export const RadioGroup = memo(
  ({
    name,
    value,
    defaultValue,
    options,
    onChange,
    disabled,
    label,
    className,
  }: RadioGroupProps) => {
    const generatedName = useId();
    const groupName = name ?? generatedName;

    return (
      <fieldset className={cn("grid gap-3", className)} disabled={disabled}>
        {label && (
          <legend className="text-sm font-medium text-text">{label}</legend>
        )}
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "inline-flex items-center gap-3 text-sm text-text",
              (disabled || option.disabled) && "cursor-not-allowed opacity-50",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value !== undefined ? value === option.value : undefined}
              defaultChecked={defaultValue === option.value}
              disabled={option.disabled}
              onChange={(event) => onChange?.(event.target.value, event)}
              className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-primary-glow"
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    );
  },
);

RadioGroup.displayName = "RadioGroup";
