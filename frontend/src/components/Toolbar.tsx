import type { Editor } from "@tiptap/react";
import { useState } from "react";

interface ToolbarProps {
  editor: Editor | null;
  connected: boolean;
  onToggleChat: () => void;
  chatOpen: boolean;
}

export function Toolbar({
  editor,
  connected,
  onToggleChat,
  chatOpen,
}: ToolbarProps) {
  const [copied, setCopied] = useState(false);

  if (!editor) return null;

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const btnBase =
    "px-2.5 py-1.5 rounded text-sm font-medium transition-colors duration-150";
  const btnActive = "bg-accent text-white";
  const btnInactive = "text-gray-300 hover:bg-white/10";

  return (
    <div className="flex items-center gap-1 bg-surface border border-border rounded-lg px-3 py-2 mb-3 flex-wrap">
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnInactive}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} ${editor.isActive("italic") ? btnActive : btnInactive}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${btnBase} ${editor.isActive("underline") ? btnActive : btnInactive}`}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${btnBase} ${editor.isActive("strike") ? btnActive : btnInactive}`}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`${btnBase} ${editor.isActive("heading", { level: 1 }) ? btnActive : btnInactive}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`${btnBase} ${editor.isActive("heading", { level: 2 }) ? btnActive : btnInactive}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`${btnBase} ${editor.isActive("heading", { level: 3 }) ? btnActive : btnInactive}`}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btnBase} ${editor.isActive("bulletList") ? btnActive : btnInactive}`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} ${editor.isActive("orderedList") ? btnActive : btnInactive}`}
          title="Ordered List"
        >
          1. List
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5" title={connected ? "Connected" : "Disconnected"}>
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-400" : "bg-red-400"
            }`}
          />
          <span className="text-xs text-gray-400">
            {connected ? "Live" : "Offline"}
          </span>
        </div>

        <button
          onClick={copyShareLink}
          className={`${btnBase} ${btnInactive} border border-border`}
        >
          {copied ? "Copied!" : "Share"}
        </button>

        <button
          onClick={onToggleChat}
          className={`${btnBase} ${chatOpen ? btnActive : btnInactive} border border-border`}
        >
          AI Chat
        </button>
      </div>
    </div>
  );
}
