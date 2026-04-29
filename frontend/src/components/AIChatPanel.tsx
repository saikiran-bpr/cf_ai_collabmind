import { useState, useRef, useEffect, useMemo } from "react";
import { marked } from "marked";
import type { ChatMessage } from "../hooks/useAI";

interface AIChatPanelProps {
  messages: ChatMessage[];
  onSendAsk: (message: string) => void;
  onSendEdit: (message: string) => void;
  onUndoEdit: (snapshot: string) => void;
  loading: boolean;
  onClose: () => void;
}

export function AIChatPanel({
  messages,
  onSendAsk,
  onSendEdit,
  onUndoEdit,
  loading,
  onClose,
}: AIChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [input]);

  function handleSubmit(mode: "ask" | "edit") {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    if (mode === "ask") onSendAsk(text);
    else onSendEdit(text);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e.metaKey || e.ctrlKey ? "edit" : "ask");
    }
  }

  const showEmptyState = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-surface">
      <Header onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showEmptyState ? (
          <EmptyState onPick={(s) => setInput(s)} />
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onUndoEdit={onUndoEdit} />
          ))
        )}
        {loading && messages[messages.length - 1]?.role === "user" && <ThinkingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <InputArea
        input={input}
        setInput={setInput}
        onSend={handleSubmit}
        loading={loading}
        inputRef={inputRef}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-blue-500/8 to-cyan-500/8">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-white leading-tight">AI Assistant</div>
          <div className="text-[11px] text-gray-400 leading-tight mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Reading your document
          </div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-gray-500 hover:text-gray-300 transition-colors w-7 h-7 flex items-center justify-center rounded hover:bg-white/5"
        title="Close"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  const examples = [
    { icon: "📋", text: "Summarize this document for me" },
    { icon: "🔍", text: "What are the key points so far?" },
    { icon: "✏️", text: "Add a conclusion section" },
    { icon: "🛠️", text: "Rewrite the intro to be more engaging" },
  ];
  return (
    <div className="text-center py-6 space-y-5">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/20">
        <svg className="w-7 h-7 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
        </svg>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">How can I help?</h3>
        <p className="text-[11px] text-gray-500 mt-1 px-2">
          Ask questions or instruct me to edit your document.
        </p>
      </div>
      <div className="space-y-1.5 px-1">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onPick(ex.text)}
            className="w-full text-left bg-white/3 hover:bg-white/8 border border-border rounded-lg px-3 py-2 text-[12px] text-gray-300 transition-colors flex items-center gap-2"
          >
            <span>{ex.icon}</span>
            <span>{ex.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  onUndoEdit,
}: {
  msg: ChatMessage;
  onUndoEdit: (snapshot: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-gradient-to-br from-accent to-indigo-500 text-white rounded-2xl rounded-tr-sm px-3.5 py-2 text-sm leading-relaxed shadow-md">
          {msg.content}
        </div>
      </div>
    );
  }

  const isEditApplied = msg.kind === "edit-applied";

  return (
    <div className="flex gap-2.5 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/30">
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`bg-white/4 border ${
            isEditApplied ? "border-green-400/30" : "border-border"
          } rounded-2xl rounded-tl-sm px-3.5 py-2 text-sm`}
        >
          {isEditApplied && (
            <div className="flex items-center gap-1.5 text-[11px] text-green-400 font-semibold uppercase tracking-wide mb-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Document updated
            </div>
          )}
          <MessageContent content={msg.content} streaming={msg.streaming} />
          {isEditApplied && msg.undoSnapshot && (
            <button
              onClick={() => onUndoEdit(msg.undoSnapshot!)}
              className="mt-2 text-[11px] text-accent hover:underline font-medium"
            >
              ↺ Undo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageContent({
  content,
  streaming,
}: {
  content: string;
  streaming?: boolean;
}) {
  const html = useMemo(() => {
    try {
      return marked.parse(content, { breaks: true, gfm: true, async: false }) as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div className="prose-chat text-gray-200 leading-relaxed">
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {streaming && (
        <span className="inline-block w-1.5 h-3.5 bg-accent ml-0.5 align-middle animate-pulse" />
      )}
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
        </svg>
      </div>
      <div className="bg-white/4 border border-border rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex gap-1">
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-gray-400" />
      </div>
    </div>
  );
}

function InputArea({
  input,
  setInput,
  onSend,
  loading,
  inputRef,
  onKeyDown,
}: {
  input: string;
  setInput: (s: string) => void;
  onSend: (mode: "ask" | "edit") => void;
  loading: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const cmd = isMac ? "⌘" : "Ctrl";

  return (
    <div className="border-t border-border bg-gradient-to-b from-surface to-[#141414] px-3 py-3">
      <div className="bg-white/3 border border-border focus-within:border-accent/50 rounded-xl transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask or instruct AI..."
          rows={1}
          disabled={loading}
          className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none resize-none max-h-40"
        />
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          <div className="text-[10px] text-gray-600 hidden sm:block">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-border rounded font-mono">↵</kbd> ask{" "}
            <span className="text-gray-700">·</span>{" "}
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-border rounded font-mono">{cmd}↵</kbd> edit doc
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => onSend("edit")}
              disabled={loading || !input.trim()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/30 hover:to-indigo-500/30 text-purple-200 border border-purple-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Apply this instruction to your document"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Apply
            </button>
            <button
              onClick={() => onSend("ask")}
              disabled={loading || !input.trim()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-medium bg-gradient-to-r from-blue-500 to-cyan-500 hover:brightness-110 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/30"
              title="Send as question"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
