import { useEffect } from "react";

export function useSendShortcut(onSend: () => void | Promise<void>) {
  useEffect(() => {
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      const isSendShortcut =
        (event.metaKey || event.ctrlKey) && event.key === "Enter";

      if (!isSendShortcut) return;

      event.preventDefault();
      void onSend();
    };

    window.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [onSend]);
}
