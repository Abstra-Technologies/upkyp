"use client";

import { ArrowLeft, MoreVertical, MessageCircle, Check, CheckCheck } from "lucide-react";
import type { Message, Chat } from "@/hooks/commons/useChatComponent";

interface ChatWindowProps {
  selectedChat: Chat;
  messages: Message[];
  isTyping: boolean;
  userId: string;
  groupedMessages: Record<string, Message[]>;
  formatTime: (timestamp: string) => string;
  onBack: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatWindow({
  selectedChat,
  messages,
  isTyping,
  userId,
  groupedMessages,
  formatTime,
  onBack,
  messagesEndRef,
}: ChatWindowProps) {
  return (
    <div
      className={`
        flex-1 flex-col bg-white relative
        ${selectedChat ? "flex" : "hidden md:flex"}
      `}
    >
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 z-10">
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <img
          src={selectedChat.profilePicture || "/default-avatar.png"}
          alt={selectedChat.name}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 truncate">
            {selectedChat.name}
          </h2>
          {isTyping ? (
            <p className="text-xs text-emerald-600 font-medium">Typing...</p>
          ) : (
            <p className="text-xs text-gray-500">Tap for info</p>
          )}
        </div>

        <button className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Start the conversation
            </h3>
            <p className="text-sm text-gray-500">
              Send a message to {selectedChat.name}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                <div className="flex justify-center my-4">
                  <span className="px-4 py-1.5 bg-white text-gray-500 text-xs font-medium rounded-full shadow-sm border border-gray-100">
                    {date}
                  </span>
                </div>

                <div className="space-y-2">
                  {msgs.map((msg, i) => {
                    const isOwn = msg.sender_id === userId;

                    return (
                      <div
                        key={i}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`
                            max-w-[80%] px-4 py-2.5 rounded-2xl
                            ${
                              isOwn
                                ? "bg-blue-600 text-white rounded-br-md"
                                : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                            }
                          `}
                        >
                          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                            {msg.message}
                          </p>
                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1 ${
                              isOwn ? "text-blue-200" : "text-gray-400"
                            }`}
                          >
                            <span className="text-[11px]">
                              {formatTime(msg.timestamp)}
                            </span>
                            {isOwn &&
                              (msg.status === "read" ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
