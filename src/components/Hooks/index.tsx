import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

function Hooks() {
  const [state, setState] = useState<number>(0);

  const onSetState = useCallback(() => {
    // state -> 1
    setState((prev) => prev + 1);
  }, []);

  // good
  const timeClicked = useMemo(() => {
    return `clicked at ${new Date().toLocaleDateString()}  ${state}`;
  }, [state]);

  const ref = useRef<HTMLHeadingElement | null>(null);
  const noRenderRef = useRef<number>(0);

  const [anotherState, setAnotherState] = useState<number>(0);

  useEffect(() => {
    if (ref.current == null) return;

    const isOdd = state % 2 === 1;

    ref.current.style.background = isOdd ? "red" : "blue";
  }, [state]);

  return (
    <div>
      <h1 ref={ref}>Hooks</h1>
      <div>
        <h2>State: {timeClicked}</h2>
      </div>

      <button onClick={onSetState}>Set State</button>

      <div>
        <h2>noRenderRef: {noRenderRef.current}</h2>
      </div>

      <button onClick={() => noRenderRef.current++}>No Render</button>

      <button onClick={() => setAnotherState((prev) => prev + 1)}>
        Another Component
      </button>

      <AnotherComponent value={anotherState} />
    </div>
  );
}

export default Hooks;

const AnotherComponent = memo(
  ({ value }: { value: number }) => {
    console.log("AnotherComponent");

    return <div>AnotherComponent {value}</div>;
  },
  (prev, next) => {
    // true -> no render
    // false -> render
    return prev.value === next.value;
  }
);

AnotherComponent.displayName = "AnotherComponent";
