import { IChatState } from "@/interfaces/chat.interface";
import { cn } from "@/lib/utils";
import React, {
  DetailedHTMLProps,
  InputHTMLAttributes,
  memo,
  useCallback,
  useMemo,
} from "react";
import { MdDelete } from "react-icons/md";
import { TbPlus } from "react-icons/tb";

const Input = memo(
  ({
    setState,
    state,
    defaultSize = "w-20",
    initialFocus = true,
    onEnter,
    ...props
  }: DetailedHTMLProps<
    InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & {
    defaultSize?: string;
    onEnter?: () => void;
    initialFocus?: boolean;
    setState: React.Dispatch<React.SetStateAction<IChatState>>;
    state: IChatState;
  }) => {
    const value = useMemo(() => state[props.name as keyof IChatState], [state]);

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && onEnter) {
          onEnter();
        }

        props.onKeyDown?.(e);
      },
      [props]
    );

    const onChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        let nextValue = e.target.value;
        // @ts-expect-error - Data does exist
        const data = e.nativeEvent.data;

        if (props.min && nextValue < props.min) {
          e.target.value = data || props.min.toString();
        }

        if (props.max && nextValue > props.max) {
          e.target.value = data >= props.min ? data : props.max.toString();
        }

        setState((prev) => ({
          ...prev,
          [props.name as keyof IChatState]: e.target.value,
        }));

        props.onChange?.(e);
      },
      [props]
    );

    const onRef = useCallback(
      (el: HTMLInputElement) => {
        if (initialFocus === false) return;

        if (el) {
          setTimeout(() => {
            el.focus();
          });
        }
      },
      [initialFocus]
    );

    const onFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        // Temporarily set the type as text
        e.target.type = "text";
        e.target.select();
        e.target.type = props.type || "text";

        props.onFocus?.(e);
      },
      [props]
    );

    if (Array.isArray(value)) {
      return (
        <ArrayInput values={value} setState={setState} name={props.name} />
      );
    }

    return (
      <div className={cn("flex self-end")}>
        <input
          ref={onRef}
          value={value}
          onKeyDown={onKeyDown}
          onChange={onChange}
          onFocus={onFocus}
          className={cn(
            "bg-neutral-900",
            "border-none",
            "rounded-3xl",
            "rounded-r-sm",
            "p-2",
            "text-white",
            "text-center",
            "outline-neutral-100",
            defaultSize
          )}
          {...props}
        />
      </div>
    );
  }
);

export default Input;

const ArrayInput = memo(
  ({
    values,
    setState,
    name,
  }: {
    values: number[];
    name: string;
    setState: React.Dispatch<React.SetStateAction<IChatState>>;
  }) => {
    const handleAdd = useCallback(() => {
      setState((prev) => ({
        ...prev,
        [name]: [...prev[name], 0],
      }));
    }, [values]);

    const deleteValue = useCallback(
      (i: number) => {
        setState((prev) => ({
          ...prev,
          [name]: prev[name].filter((_, index) => index !== i),
        }));
      },
      [values]
    );

    return (
      <div
        className={cn(
          "flex flex-col self-end",
          "gap-2",
          "items-center justify-center",
          "bg-neutral-900",
          "border-none",
          "rounded-3xl",
          "rounded-r-sm",
          "p-2",
          "text-white",
          "text-center",
          "outline-neutral-100"
        )}
      >
        {!!values.length && (
          <div className={cn("flex flex-col", "gap-2")}>
            {values.map((value, i) => (
              <div className={cn("flex", "gap-2", "items-center")}>
                <input
                  key={i}
                  className={cn(
                    "bg-neutral-900",
                    "border-none",
                    "rounded-md",
                    "p-2",
                    "text-white",
                    "text-center",
                    "outline-none",
                    "w-12"
                  )}
                  value={value}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    const nextValues = [...values];
                    nextValues[i] = Number(nextValue);

                    setState((prev) => ({
                      ...prev,
                      [name]: nextValues,
                    }));
                  }}
                />
                <MdDelete
                  onClick={() => deleteValue(i)}
                  className="cursor-pointer"
                />
              </div>
            ))}
          </div>
        )}

        <TbPlus size={30} onClick={handleAdd} className="cursor-pointer" />
      </div>
    );
  }
);
