"use client";

import { useEffect, useState, Suspense } from "react";
import { io } from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";
import useAuth from "../../../../hooks/useSession";
import axios from "axios";

const SearchParamsWrapper = ({ setLandlordId }) => {
    const searchParams = useSearchParams();
    const landlord_id = searchParams.get("landlord_id");

    useEffect(() => {
        setLandlordId(landlord_id);
    }, [landlord_id, setLandlordId]);

    return null;
};

export default function Chat() {
    const { user } = useAuth();
    const router = useRouter();
    const [landlord_id, setLandlordId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [landlordName, setLandlordName] = useState("Landlord");

    const chat_room = `chat_${[user?.user_id, landlord_id].sort().join("_")}`;
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", { autoConnect: true });

    useEffect(() => {
        if (!landlord_id) return;
        axios.get(`/api/chat/getLandlordName?landlord_id=${landlord_id}`)
            .then((res) => {
                if (res.data.landlordName) {
                    setLandlordName(res.data.landlordName);
                }
            })
            .catch((error) => console.error("Fetch error:", error));
    }, [landlord_id]);

    useEffect(() => {
        if (!user || !landlord_id) return;

        const fetchMessages = async () => {
            try {
                const response = await axios.get(`/api/chats/messages?chat_room=${chat_room}`);
                setMessages(response.data.map(msg => ({
                    ...msg,
                    isSender: msg.sender_id === user.user_id,
                })));
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();

        socket.emit("joinRoom", { chat_room });

        socket.on("loadMessages", (loadedMessages) => {
            setMessages(loadedMessages.map(msg => ({
                ...msg,
                isSender: msg.sender_id === user.user_id,
            })));
        });

        socket.on("receiveMessage", (message) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    ...message,
                    isSender: message.sender_id === user.user_id,
                },
            ]);
        });

        return () => {
            socket.off("loadMessages");
            socket.off("receiveMessage");
            socket.disconnect();
        };
    }, [user, landlord_id, chat_room]);

    const sendMessage = () => {
        if (!user || !landlord_id || newMessage.trim() === "") return;

        const newMsg = {
            sender_id: user.user_id,  // Ensure sender_id is always user_id
            sender_type: user.tenant_id ? "tenant" : "landlord",
            receiver_id: landlord_id,
            receiver_type: "landlord",
            message: newMessage,
            chat_room,
        };

        setMessages((prevMessages) => [...prevMessages, { ...newMsg, isSender: true }]);

        socket.emit("sendMessage", newMsg);
        setNewMessage("");
    };

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-600">Loading Chat...</p>
            </div>
        }>
            <SearchParamsWrapper setLandlordId={setLandlordId} />
            <div className="flex flex-col h-screen">
                {/* Header */}
                <div className="bg-blue-600 text-white p-3 md:p-4 flex items-center shadow-md">
                    <button onClick={() => router.back()} className="mr-2 p-1 rounded-full hover:bg-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <h1 className="text-base md:text-lg font-bold flex-1 text-center truncate pr-6">
                        Chat with {landlordName}
                    </h1>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-gray-50">
                    {messages.length === 0 ? (
                        <p className="text-center text-gray-500">No messages yet</p>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`mb-3 flex ${msg.isSender ? "justify-end" : "justify-start"}`}>
                                <div className="max-w-[75%] md:max-w-[70%]">
                                    <p className="text-xs text-gray-500 mb-1 px-1">
                                        {msg.isSender ? "You" : msg.sender_name}
                                    </p>
                                    <div className={`p-2 md:p-3 rounded-lg break-words ${
                                        msg.isSender ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                                    }`}>
                                        <p className="text-sm md:text-base">{msg.message || "[Encrypted Message]"}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 bg-white p-2 sm:p-3">
                    <div className="flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Type your message..."
                        />
                        <button
                            onClick={sendMessage}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 md:px-4 py-2 rounded-r-lg transition-colors flex items-center justify-center min-w-[60px]"
                        >
                            <span className="hidden sm:inline">Send</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Suspense>
    );
}
