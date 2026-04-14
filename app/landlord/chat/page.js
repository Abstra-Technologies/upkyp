"use client";

import { useEffect } from "react";
import ChatComponent from "@/components/chat/chat";
import useAuthStore from "@/zustand/authStore";
import { useChatStore } from "@/zustand/chatStore";

export default function LandlordChatPage() {
  const { user } = useAuthStore();
  const { preselectedChat, clearPreselectedChat } = useChatStore();
  const userId = user?.user_id;

  useEffect(() => {
    clearPreselectedChat();
  }, [clearPreselectedChat]);

  return (
      <div className='pt-14'>
    <ChatComponent
      userId={userId}
      preselectedChat={preselectedChat || undefined}
      variant="landlord"
    /></div>
  );
}
