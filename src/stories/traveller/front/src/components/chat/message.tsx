import { cn } from "@/lib/utils";
import React, { memo } from "react";
import ChatbotIcon from "../icons/chatbot";

const Message = memo(
  ({
    message,
    type,
    error,
  }: {
    error?: boolean;
    message: string;
    type: "bot" | "user";
  }) => {
    return (
      <div
        className={cn(
          "flex items-center",
          "gap-2",
          type === "user" && "justify-end"
        )}
      >
        {type === "bot" && <ChatbotIcon />}

        <p
          className={cn(
            type === "bot" && [
              "pl-2 pr-5 py-2",
              "rounded-3xl",
              "rounded-s-sm",
              "bg-neutral-700	",
            ],
            error && ["bg-red-500", "text-white"]
          )}
        >
          {message}
        </p>
      </div>
    );
  }
);

export default Message;

Message.displayName = "Message";
