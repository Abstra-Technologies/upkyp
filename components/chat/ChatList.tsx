"use client";

import { Search, MessageCircle, X } from "lucide-react";
import type { Chat } from "@/hooks/commons/useChatComponent";

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  searchQuery: string;
  error: string | null;
  loading: boolean;
  onSelectChat: (chat: Chat) => void;
  onSearchChange: (query: string) => void;
  formatLastSeen: (timestamp: string) => string;
}

export default function ChatList({
  chats,
  selectedChat,
  searchQuery,
  error,
  loading,
  onSelectChat,
  onSearchChange,
  formatLastSeen,
}: ChatListProps) {
  if (loading) {
    return (
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <div className="h-8 bg-gray-200 rounded-lg w-32 mb-4 animate-pulse" />
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="flex-1 p-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 animate-pulse"
            >
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        w-full md:w-80 lg:w-96
        bg-white border-r border-gray-200
        flex-col flex-shrink-0
        ${selectedChat ? "hidden md:flex" : "flex"}
      `}
    >
      <div className="flex-shrink-0 p-4 bg-white border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
            style={{ fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchQuery ? "No results found" : "No conversations yet"}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try a different search term"
                : "Messages will appear here"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {chats.map((chat) => (
              <button
                key={chat.chat_room}
                onClick={() => onSelectChat(chat)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-all active:bg-gray-100
                  ${
                    selectedChat?.chat_room === chat.chat_room
                      ? "bg-blue-50 border-l-4 border-blue-600"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }
                `}
              >
                <img
                  src={chat.profilePicture || "/default-avatar.png"}
                  alt={chat.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {chat.lastMessageTime
                        ? formatLastSeen(chat.lastMessageTime)
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate pr-2">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                    {chat.unreadCount! > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                        {chat.unreadCount! > 99 ? "99+" : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
