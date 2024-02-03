import React, { useCallback } from "react";
import FirstContextProvider, { useFirstContext } from "./utils/context";

function Context() {
  const MESSI = "MESSI is better than Ronaldo";

  return (
    <FirstContextProvider MESSI={MESSI}>
      <Parent />
    </FirstContextProvider>
  );
}

function Parent() {
  const { day, setDay, MESSI } = useFirstContext();

  const increment = useCallback(() => {
    setDay(new Date(day.getTime() + 24 * 60 * 60 * 1000));
  }, [day, setDay]);

  return (
    <div>
      <button onClick={increment}>increment in parent</button>

      <h1>Context</h1>
      <Children />
      <button onClick={() => console.log(MESSI)}>log MESSI</button>
    </div>
  );
}

export default Context;

const Children = () => {
  const { day, setDay } = useFirstContext();

  const increment = useCallback(() => {
    setDay(new Date(day.getTime() + 24 * 60 * 60 * 1000));
  }, [day, setDay]);

  return (
    <div>
      <button onClick={increment}>increment</button>
      {day.getDate()}
    </div>
  );
};
