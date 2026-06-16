"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Leaf } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  "How does pricing work?",
  "What is CQC compliance?",
  "Can I import paper care plans?",
  "How does the carer app work?",
  "Tell me about the family portal",
];

const WELCOME = "Hi there 👋 I am the Careroot assistant. I can answer questions about our care management platform, pricing, CQC compliance, or help you decide if Careroot is right for your agency. What would you like to know?";

function formatTime(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mins ago`;
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: "assistant", content: WELCOME, timestamp: new Date() }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setShowQuickReplies(false);

    const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please email hello@careroot.care", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Chat window */}
      {isOpen && (
        <div
          className="mb-4 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          style={{ width: "min(380px, calc(100vw - 32px))", height: "520px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0 p-4" style={{ backgroundColor: "#1A3C2E" }}>
            <div className="flex items-center gap-2">
              <Leaf size={18} className="text-white" />
              <div>
                <p className="text-sm font-medium text-white font-body">Careroot Assistant</p>
                <p className="text-xs text-white/60 font-body">Online · Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className="max-w-[85%] px-3.5 py-2.5 text-sm font-body leading-relaxed"
                  style={{
                    backgroundColor: msg.role === "user" ? "#1A3C2E" : "#E8F5EE",
                    color: msg.role === "user" ? "#ffffff" : "#1C1C1E",
                    borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  }}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-[#6B7280] mt-1 font-body">{formatTime(msg.timestamp)}</span>
              </div>
            ))}

            {/* Quick replies */}
            {showQuickReplies && messages.length === 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="flex-shrink-0 border border-gray-200 bg-white text-[#1C1C1E] rounded-full px-3 py-1.5 text-xs font-body whitespace-nowrap hover:bg-[#E8F5EE] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Loading dots */}
            {isLoading && (
              <div className="flex items-start">
                <div className="px-3.5 py-3 rounded-xl rounded-tl-sm bg-[#E8F5EE] flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#4A7C5E] inline-block"
                      style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-gray-100 p-3 flex gap-2 items-center bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask a question..."
              className="flex-1 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-body outline-none focus:border-[#1A3C2E] transition-colors"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="p-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#1A3C2E" }}
              onMouseEnter={(e) => { if (!(!input.trim() || isLoading)) e.currentTarget.style.backgroundColor = "#4A7C5E"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1A3C2E"; }}
              aria-label="Send"
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center transition-colors shadow-lg"
        style={{ backgroundColor: "#1A3C2E" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4A7C5E")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1A3C2E")}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
