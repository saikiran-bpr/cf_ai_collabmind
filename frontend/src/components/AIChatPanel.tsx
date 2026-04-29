import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  loading: boolean;
  onClose: () => void;
}

export function AIChatPanel({
  messages,
  onSend,
  loading,
  onClose,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend(text);
  }

  return (
    <div className="flex flex-col h-full bg-surface border-l border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-sm font-semibold text-white">AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-white/5 text-gray-300 border border-border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-border rounded-lg px-3 py-2 flex gap-1">
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
              <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-border flex gap-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your document..."
          className="flex-1 bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-accent hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
