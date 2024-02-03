import React, {
  createContext,
  memo,
  useContext,
  useMemo,
  useState,
} from "react";

export interface IFirstContext {
  day: Date;
  setDay: (day: Date) => void;
  MESSI?: string;
}

const FirstContext = createContext<IFirstContext>({
  day: new Date(),
  setDay: () => {},
});

const FirstContextProvider = memo(
  ({ children, MESSI }: { children: React.ReactNode; MESSI?: string }) => {
    const [day, setDay] = useState(new Date());

    const value = useMemo(() => ({ day, setDay, MESSI }), [MESSI, day]);

    return (
      <FirstContext.Provider value={value}>{children}</FirstContext.Provider>
    );
  }
);

FirstContextProvider.displayName = "FirstContextProvider";

export default FirstContextProvider;

export const useFirstContext = () => useContext(FirstContext);
