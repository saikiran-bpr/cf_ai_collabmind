import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { WebsocketProvider } from "y-websocket";

interface StatusBarProps {
  editor: Editor | null;
  provider: WebsocketProvider | null;
  connected: boolean;
  onlineCount: number;
  docId: string;
}

export function StatusBar({
  editor,
  provider,
  connected,
  onlineCount,
  docId,
}: StatusBarProps) {
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "offline">(
    "saved"
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!editor) return;

    function update() {
      if (!editor) return;
      const text = editor.getText();
      const words = text.split(/\s+/).filter(Boolean).length;
      setStats({ words, chars: text.length });
    }

    update();
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || !provider) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    function onChange() {
      if (!connected) {
        setSaveStatus("offline");
        return;
      }
      setSaveStatus("saving");
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setSaveStatus("saved"), 800);
    }

    editor.on("update", onChange);
    return () => {
      editor.off("update", onChange);
      if (timer) clearTimeout(timer);
    };
  }, [editor, provider, connected]);

  useEffect(() => {
    if (!connected) setSaveStatus("offline");
    else if (saveStatus === "offline") setSaveStatus("saved");
  }, [connected, saveStatus]);

  const readingMin = Math.max(1, Math.round(stats.words / 200));

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-surface border-t border-border text-[11px] text-gray-500">
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            saveStatus === "saved"
              ? "bg-green-400"
              : saveStatus === "saving"
                ? "bg-amber-400 animate-pulse"
                : "bg-red-400"
          }`}
        />
        <span className="capitalize">{saveStatus}</span>
      </div>

      <span className="text-gray-700">·</span>

      <span>{stats.words.toLocaleString()} words</span>
      <span>{stats.chars.toLocaleString()} chars</span>
      <span>~{readingMin} min read</span>

      <span className="text-gray-700">·</span>

      <span>
        {onlineCount} {onlineCount === 1 ? "person" : "people"} online
      </span>

      <div className="flex-1" />

      <span className="text-gray-600 hidden md:inline">
        Doc: <code className="text-gray-400 font-mono">{docId.slice(0, 8)}</code>
      </span>

      <button
        onClick={copyShareLink}
        className="text-gray-400 hover:text-white px-2 py-0.5 rounded transition-colors"
      >
        {copied ? "Copied!" : "Share link"}
      </button>
    </div>
  );
}
