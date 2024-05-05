import { cn } from "@/lib/utils";
import React, { memo } from "react";
import { TbMessageChatbot } from "react-icons/tb";

const ChatbotIcon = memo(() => {
  return (
    <div
      className={cn(
        "w-12 h-12",
        "rounded-full",
        "bg-neutral-700",
        "flex items-center justify-center"
      )}
      title="Travvy"
    >
      <TbMessageChatbot size={25} />
    </div>
  );
});

ChatbotIcon.displayName = "ChatbotIcon";

export default ChatbotIcon;
