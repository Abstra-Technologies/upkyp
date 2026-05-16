"use client";

import { Send, Smile, Paperclip, X } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

interface MessageInputProps {
  message: string;
  isSending: boolean;
  showEmojiPicker: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  onMessageChange: (msg: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onEmojiSelect: (emoji: any) => void;
  onToggleEmoji: () => void;
}

export default function MessageInput({
  message,
  isSending,
  showEmojiPicker,
  inputRef,
  emojiPickerRef,
  onMessageChange,
  onSend,
  onKeyPress,
  onEmojiSelect,
  onToggleEmoji,
}: MessageInputProps) {
  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-100">
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-28 left-2 right-2 md:left-auto md:right-4 md:w-[350px] bg-white shadow-2xl rounded-2xl overflow-hidden z-50 border border-gray-200"
        >
          <EmojiPicker
            onEmojiClick={onEmojiSelect}
            theme={"light" as any}
            emojiStyle={"native" as any}
            lazyLoadEmojis={true}
            width="100%"
            height={280}
          />
        </div>
      )}

      <div className="px-3 pt-2 pb-2 md:pb-3">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <button className="p-2.5 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors flex-shrink-0 hidden sm:flex">
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex-1 relative bg-gray-100 rounded-full flex items-center min-w-0">
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="on"
              autoCapitalize="sentences"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-transparent placeholder:text-gray-400 focus:outline-none min-w-0"
              style={{ fontSize: "16px" }}
            />
            <button
              onClick={onToggleEmoji}
              className={`p-2 mr-1 rounded-full transition-colors flex-shrink-0 ${
                showEmojiPicker
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-200 active:bg-gray-300 text-gray-500"
              }`}
            >
              {showEmojiPicker ? (
                <X className="w-5 h-5" />
              ) : (
                <Smile className="w-5 h-5" />
              )}
            </button>
          </div>

          <button
            onClick={onSend}
            disabled={!message.trim() || isSending}
            className={`
              p-3 rounded-full transition-all flex-shrink-0 active:scale-95
              ${
                message.trim()
                  ? "bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="bg-white"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
        }}
      />
    </div>
  );
}
