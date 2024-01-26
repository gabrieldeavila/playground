import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";

interface IChildRef {
  childFunction: () => void;
  minecraft: string;
  min: string;
}

function Imperative() {
  const childRef = useRef<IChildRef>(null);

  const onClick = useCallback(() => {
    if (childRef.current == null) return;

    childRef.current.childFunction();
  }, []);

  return (
    <div>
      <h1>Imperative</h1>
      <button onClick={onClick}>Access child function</button>

      <Child ref={childRef} />
    </div>
  );
}

export default Imperative;

const Child = memo(
  forwardRef<IChildRef>((_props, ref) => {
    const childFunction = useCallback(() => {
      alert("child");
    }, []);

    useImperativeHandle(ref, () => ({
      childFunction,
      minecraft: "dsadsa",
      min: "nn",
    }));

    return (
      <div>
        <h2>Child</h2>
        <button onClick={childFunction}>Click Me (child)</button>
      </div>
    );
  })
);

Child.displayName = "Child";
