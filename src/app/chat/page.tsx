"use client";
import { useState } from "react";
import { Paperclip, Send } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "them", text: "Halo, ada yang bisa saya bantu?" },
    { id: 2, sender: "me", text: "Ya, saya mau tanya tentang layanan Anda." },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: "me", text: input }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4 shadow-sm flex items-center">
        <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-3">
          C
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Customer Service</h2>
          <p className="text-sm text-green-500">Online</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-xs shadow text-sm ${
                msg.sender === "me"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Box */}
      <div className="bg-white border-t p-3 flex items-center space-x-2">
        <button className="p-2 text-gray-500 hover:text-blue-600 transition">
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="text"
          placeholder="Tulis pesan..."
          className="text-gray-600 flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
