import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";

interface ToolbarProps {
  editor: Editor | null;
  onToggleChat: () => void;
  chatOpen: boolean;
}

export function Toolbar({ editor, onToggleChat, chatOpen }: ToolbarProps) {
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

      <button
        onClick={onToggleChat}
        className={`flex items-center gap-1.5 px-3 py-1 rounded text-[13px] font-medium transition-colors ${
          chatOpen
            ? "bg-accent text-white"
            : "bg-white/5 text-gray-200 hover:bg-white/10 border border-border"
        }`}
        title="AI assistant"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        AI
      </button>
    </div>
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
