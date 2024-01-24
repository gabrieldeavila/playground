import React, { useState } from "react";
import { createPortal } from "react-dom";

function Portal() {
  const [state, setState] = useState<HTMLHeadingElement | null>(null);

  const onRef = (ref: HTMLHeadingElement | null) => {
    setState(ref);
  };

  return (
    <div>
      <h1 ref={onRef}>Portal</h1>
      <Child parentRef={state} />
    </div>
  );
}

export default Portal;

const Child = ({ parentRef }: { parentRef: HTMLHeadingElement | null }) => {
  if (parentRef == null) return null;
  console.log("----", parentRef);

  return createPortal(
    <div>
      <h2>Child</h2>
    </div>,
    parentRef
  );
};
