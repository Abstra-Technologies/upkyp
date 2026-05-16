"use client";

import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import EmptyState from "./EmptyState";
import { useChatComponent } from "@/hooks/commons/useChatComponent";

interface ChatComponentProps {
  userId: string;
  preselectedChat?: any;
  variant?: "tenant" | "landlord";
}

export default function ChatComponent({
  userId,
  preselectedChat,
  variant = "tenant",
}: ChatComponentProps) {
  const {
    filteredChats,
    selectedChat,
    setSelectedChat,
    messages,
    message,
    setMessage,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    isTyping,
    showEmojiPicker,
    setShowEmojiPicker,
    isSending,
    messagesEndRef,
    inputRef,
    emojiPickerRef,
    handleEmojiSelect,
    sendMessage,
    handleKeyPress,
    formatTime,
    formatDate,
    formatLastSeen,
    groupedMessages,
  } = useChatComponent(userId, preselectedChat);

  return (
    <div
      className="flex w-full bg-gray-50 overflow-hidden touch-manipulation"
      style={{
        height:
          variant === "tenant"
            ? "calc(100dvh - 3.5rem)"
            : "calc(100dvh - 3.5rem)",
      }}
    >
      <ChatList
        chats={filteredChats}
        selectedChat={selectedChat}
        searchQuery={searchQuery}
        error={error}
        loading={loading}
        onSelectChat={setSelectedChat}
        onSearchChange={setSearchQuery}
        formatLastSeen={formatLastSeen}
      />

      {selectedChat ? (
        <div className="flex-1 flex-col bg-white relative flex">
          <ChatWindow
            selectedChat={selectedChat}
            messages={messages}
            isTyping={isTyping}
            userId={userId}
            groupedMessages={groupedMessages}
            formatTime={formatTime}
            onBack={() => setSelectedChat(null)}
            messagesEndRef={messagesEndRef}
          />

          <MessageInput
            message={message}
            isSending={isSending}
            showEmojiPicker={showEmojiPicker}
            inputRef={inputRef}
            emojiPickerRef={emojiPickerRef}
            onMessageChange={setMessage}
            onSend={sendMessage}
            onKeyPress={handleKeyPress}
            onEmojiSelect={handleEmojiSelect}
            onToggleEmoji={() => setShowEmojiPicker(!showEmojiPicker)}
          />
        </div>
      ) : (
        <EmptyState filteredChats={filteredChats} />
      )}

      <style jsx global>{`
        input[type="text"],
        input[type="search"],
        textarea {
          font-size: 16px !important;
        }

        .overscroll-contain {
          overscroll-behavior: contain;
        }

        .overflow-y-auto {
          -webkit-overflow-scrolling: touch;
        }

        button {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          user-select: none;
        }

        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
}
