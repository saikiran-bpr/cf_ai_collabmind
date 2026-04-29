import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { DocAction } from "../hooks/useAIDocument";

interface ToolbarProps {
  editor: Editor | null;
  onToggleChat: () => void;
  chatOpen: boolean;
  onDocAction: (action: DocAction) => void;
  docActionRunning: DocAction | null;
}

export function Toolbar({
  editor,
  onToggleChat,
  chatOpen,
  onDocAction,
  docActionRunning,
}: ToolbarProps) {
  if (!editor) return <div className="h-[44px] bg-surface border-b border-border" />;

  const btnBase =
    "px-2 py-1 rounded text-[13px] font-medium transition-colors duration-150 min-w-[28px]";
  const btnActive = "bg-accent text-white";
  const btnInactive = "text-gray-300 hover:bg-white/10";

  function setLink() {
    const previousUrl = editor!.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().unsetLink().run();
      return;
    }
    editor!.chain().focus().setLink({ href: url }).run();
  }

  return (
    <div className="flex items-center gap-1 bg-surface border-b border-border px-3 py-1.5 flex-wrap">
      <BlockTypeDropdown editor={editor} />

      <Divider />

      <Group>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${btnBase} ${editor.isActive("bold") ? btnActive : btnInactive}`}
          title="Bold (⌘B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${btnBase} ${editor.isActive("italic") ? btnActive : btnInactive}`}
          title="Italic (⌘I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`${btnBase} ${editor.isActive("underline") ? btnActive : btnInactive}`}
          title="Underline (⌘U)"
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
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${btnBase} ${editor.isActive("code") ? btnActive : btnInactive}`}
          title="Inline code"
        >
          <span className="font-mono text-xs">{"</>"}</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`${btnBase} ${editor.isActive("highlight") ? btnActive : btnInactive}`}
          title="Highlight"
        >
          🖍
        </button>
      </Group>

      <Divider />

      <Group>
        <button
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`${btnBase} ${editor.isActive({ textAlign: "left" }) ? btnActive : btnInactive}`}
          title="Align left"
        >
          <AlignIcon align="left" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`${btnBase} ${editor.isActive({ textAlign: "center" }) ? btnActive : btnInactive}`}
          title="Align center"
        >
          <AlignIcon align="center" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`${btnBase} ${editor.isActive({ textAlign: "right" }) ? btnActive : btnInactive}`}
          title="Align right"
        >
          <AlignIcon align="right" />
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          className={`${btnBase} ${editor.isActive({ textAlign: "justify" }) ? btnActive : btnInactive}`}
          title="Justify"
        >
          <AlignIcon align="justify" />
        </button>
      </Group>

      <Divider />

      <Group>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${btnBase} ${editor.isActive("bulletList") ? btnActive : btnInactive}`}
          title="Bullet list"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${btnBase} ${editor.isActive("orderedList") ? btnActive : btnInactive}`}
          title="Numbered list"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`${btnBase} ${editor.isActive("taskList") ? btnActive : btnInactive}`}
          title="Task list"
        >
          ☐
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${btnBase} ${editor.isActive("blockquote") ? btnActive : btnInactive}`}
          title="Blockquote"
        >
          ❝
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${btnBase} ${editor.isActive("codeBlock") ? btnActive : btnInactive}`}
          title="Code block"
        >
          <span className="font-mono text-xs">{`{}`}</span>
        </button>
      </Group>

      <Divider />

      <Group>
        <button
          onClick={setLink}
          className={`${btnBase} ${editor.isActive("link") ? btnActive : btnInactive}`}
          title="Insert link"
        >
          🔗
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={`${btnBase} ${btnInactive}`}
          title="Horizontal rule"
        >
          —
        </button>
      </Group>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <AIToolsButton onAction={onDocAction} running={docActionRunning} />
        <AIChatButton chatOpen={chatOpen} onToggle={onToggleChat} />
      </div>
    </div>
  );
}

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

function AIToolsButton({
  onAction,
  running,
}: {
  onAction: (a: DocAction) => void;
  running: DocAction | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const improveActions: Array<{
    id: DocAction;
    label: string;
    description: string;
    icon: string;
  }> = [
    { id: "polish", label: "Polish writing", description: "Rephrase for clarity & flow", icon: "✨" },
    { id: "structure", label: "Add structure", description: "Headings, sections, lists", icon: "📋" },
    { id: "professional", label: "Make professional", description: "Polished business tone", icon: "🎩" },
  ];

  const transformActions: Array<{
    id: DocAction;
    label: string;
    description: string;
    icon: string;
  }> = [
    { id: "concise", label: "Make concise", description: "Cut filler, keep meaning", icon: "✂️" },
    { id: "expand", label: "Expand with detail", description: "Add examples & context", icon: "📝" },
    { id: "summarize", label: "Summarize", description: "2-4 paragraph overview", icon: "📜" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={!!running}
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
          open
            ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/40"
            : "bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-200 border border-purple-400/30 hover:border-purple-400/50 hover:shadow-md hover:shadow-purple-500/20"
        } ${running ? "opacity-60 cursor-wait" : ""}`}
        title="AI tools — transform your document"
      >
        <SparkleIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        AI Tools
        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-purple-400/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-blue-500/15 px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4 text-purple-300" />
              <div>
                <div className="text-sm font-semibold text-white">AI Document Tools</div>
                <div className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  Transform the entire document
                </div>
              </div>
            </div>
          </div>

          <div className="py-2">
            <SectionHeader>Improve</SectionHeader>
            {improveActions.map((a) => (
              <ActionItem
                key={a.id}
                {...a}
                onClick={() => {
                  setOpen(false);
                  onAction(a.id);
                }}
              />
            ))}

            <SectionHeader>Transform</SectionHeader>
            {transformActions.map((a) => (
              <ActionItem
                key={a.id}
                {...a}
                onClick={() => {
                  setOpen(false);
                  onAction(a.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AIChatButton({
  chatOpen,
  onToggle,
}: {
  chatOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all ${
        chatOpen
          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/40"
          : "bg-gradient-to-r from-blue-500/15 to-cyan-500/15 hover:from-blue-500/25 hover:to-cyan-500/25 text-blue-200 border border-blue-400/30 hover:border-blue-400/50 hover:shadow-md hover:shadow-blue-500/20"
      }`}
      title="Chat with AI about your document"
    >
      <svg
        className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      Chat
    </button>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
      {children}
    </div>
  );
}

function ActionItem({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-purple-500/10 transition-colors group"
    >
      <span className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/15 to-indigo-500/15 border border-purple-400/20 flex items-center justify-center text-base group-hover:scale-105 group-hover:from-purple-500/25 group-hover:to-indigo-500/25 transition-all">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white font-medium leading-tight">{label}</div>
        <div className="text-[11px] text-gray-500 leading-tight mt-0.5">
          {description}
        </div>
      </div>
    </button>
  );
}

function BlockTypeDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = (() => {
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor.isActive("heading", { level: 4 })) return "Heading 4";
    if (editor.isActive("blockquote")) return "Quote";
    if (editor.isActive("codeBlock")) return "Code block";
    return "Paragraph";
  })();

  const items: Array<{ label: string; action: () => void }> = [
    {
      label: "Paragraph",
      action: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "Heading 1",
      action: () =>
        editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "Heading 2",
      action: () =>
        editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "Heading 3",
      action: () =>
        editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: "Heading 4",
      action: () =>
        editor.chain().focus().toggleHeading({ level: 4 }).run(),
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[13px] font-medium text-gray-300 hover:bg-white/10 transition-colors min-w-[120px] justify-between"
      >
        <span>{current}</span>
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-48 bg-surface border border-border rounded-lg shadow-xl z-50 py-1">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.action();
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                current === item.label
                  ? "bg-accent/20 text-accent"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AlignIcon({
  align,
}: {
  align: "left" | "center" | "right" | "justify";
}) {
  const lines: Array<{ width: string; mr?: string; ml?: string }> = (() => {
    if (align === "left") return [{ width: "100%" }, { width: "70%" }, { width: "100%" }, { width: "60%" }];
    if (align === "center") return [{ width: "100%" }, { width: "70%", ml: "auto", mr: "auto" }, { width: "100%" }, { width: "60%", ml: "auto", mr: "auto" }];
    if (align === "right") return [{ width: "100%" }, { width: "70%", ml: "auto" }, { width: "100%" }, { width: "60%", ml: "auto" }];
    return [{ width: "100%" }, { width: "100%" }, { width: "100%" }, { width: "100%" }];
  })();

  return (
    <div className="flex flex-col gap-[2px] w-3.5 items-stretch">
      {lines.map((l, i) => (
        <div
          key={i}
          className="h-[2px] bg-current rounded-sm"
          style={{ width: l.width, marginLeft: l.ml, marginRight: l.mr }}
        />
      ))}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
