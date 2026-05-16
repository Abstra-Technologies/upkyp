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
      className="fixed top-14 left-0 right-0 bottom-0 flex flex-col w-full bg-gray-50 overflow-hidden touch-manipulation md:relative md:top-auto md:left-auto md:right-auto md:bottom-auto md:flex-row md:w-full md:h-[calc(100dvh-4rem)]"
    >
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
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
      </div>

      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-white relative min-w-0 overflow-hidden">
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
        <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50">
          <EmptyState filteredChats={filteredChats} />
        </div>
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
