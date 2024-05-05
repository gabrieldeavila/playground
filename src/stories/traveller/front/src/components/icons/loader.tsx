import { memo } from "react";
import { FiLoader } from "react-icons/fi";

const Loader = memo(() => {
  return (
    <FiLoader className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary-500 rounded-full" />
  );
});

export default Loader;
