"use client";

import { MessageCircle } from "lucide-react";
import type { Chat } from "@/hooks/commons/useChatComponent";

interface EmptyStateProps {
  filteredChats: Chat[];
}

export default function EmptyState({ filteredChats }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center">
          <MessageCircle className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h2>
        <p className="text-gray-500 mb-6">
          Select a conversation to start chatting
        </p>
        <div className="flex items-center justify-center gap-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredChats.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Chats</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {filteredChats.reduce(
                (acc, chat) => acc + (chat.unreadCount || 0),
                0
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">Unread</div>
          </div>
        </div>
      </div>
    </div>
  );
}
