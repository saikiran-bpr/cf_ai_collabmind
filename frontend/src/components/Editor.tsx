import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { PaginationPlus } from "tiptap-pagination-plus";
import { SlashCommands } from "../lib/slashCommands";
import { InlineCompletion } from "../lib/inlineCompletion";
import "tippy.js/dist/tippy.css";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { useEffect, useRef, useState } from "react";
import { useAIActions, type AIAction } from "../hooks/useAIActions";

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  userName: string;
  userColor: string;
  onEditorReady: (editor: ReturnType<typeof useEditor>) => void;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  onRegenerateSuggestion: () => void;
  hasSuggestion: boolean;
  loadingSuggestion: boolean;
}

export function Editor({
  ydoc,
  provider,
  userName,
  userColor,
  onEditorReady,
  onAcceptSuggestion,
  onDismissSuggestion,
  onRegenerateSuggestion,
  hasSuggestion,
  loadingSuggestion,
}: EditorProps) {
  const hasSuggestionRef = useRef(hasSuggestion);
  const acceptRef = useRef(onAcceptSuggestion);
  const dismissRef = useRef(onDismissSuggestion);
  const regenerateRef = useRef(onRegenerateSuggestion);

  useEffect(() => {
    hasSuggestionRef.current = hasSuggestion;
    acceptRef.current = onAcceptSuggestion;
    dismissRef.current = onDismissSuggestion;
    regenerateRef.current = onRegenerateSuggestion;
  }, [hasSuggestion, onAcceptSuggestion, onDismissSuggestion, onRegenerateSuggestion]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        Underline,
        Typography,
        Highlight.configure({ multicolor: false }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        SlashCommands,
        InlineCompletion,
        Link.configure({
          openOnClick: true,
          autolink: true,
          HTMLAttributes: { class: "text-accent underline" },
        }),
        Collaboration.configure({ document: ydoc }),
        ...(provider
          ? [
              CollaborationCursor.configure({
                provider,
                user: { name: userName, color: userColor },
              }),
            ]
          : []),
        Placeholder.configure({
          placeholder:
            "Type '/' for commands, or just start writing. Tab accepts AI suggestions.",
        }),
        PaginationPlus.configure({
          pageHeight: 1123,
          pageWidth: 794,
          marginTop: 56,
          marginBottom: 56,
          marginLeft: 64,
          marginRight: 64,
          pageGap: 24,
          pageGapBorderSize: 0,
          pageGapBorderColor: "transparent",
          pageBreakBackground: "#0a0a0a",
          contentMarginTop: 0,
          contentMarginBottom: 0,
          footerRight: "Page {page}",
          footerLeft: "",
          headerRight: "",
          headerLeft: "",
          customHeader: {},
          customFooter: {},
        }),
      ],
      editorProps: {
        attributes: {
          class: "focus:outline-none prose-invert max-w-none",
        },
        handleKeyDown: (_view, event) => {
          if (hasSuggestionRef.current && event.key === "Tab") {
            event.preventDefault();
            acceptRef.current();
            return true;
          }
          if (hasSuggestionRef.current && event.key === "Escape") {
            event.preventDefault();
            dismissRef.current();
            return true;
          }
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key === "/" &&
            hasSuggestionRef.current
          ) {
            event.preventDefault();
            regenerateRef.current();
            return true;
          }
          return false;
        },
      },
    },
    [ydoc, provider]
  );

  useEffect(() => {
    onEditorReady(editor);
  }, [editor, onEditorReady]);

  const { runAction, running } = useAIActions(editor);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);

  return (
    <div className="tiptap-editor flex-1 overflow-y-auto bg-[#0a0a0a]">
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100, placement: "top" }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl p-1 flex items-center gap-0.5"
        >
          <BubbleBtn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
          >
            <strong>B</strong>
          </BubbleBtn>
          <BubbleBtn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
          >
            <em>I</em>
          </BubbleBtn>
          <BubbleBtn
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            label="Underline"
          >
            <span className="underline">U</span>
          </BubbleBtn>
          <BubbleBtn
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            label="Inline code"
          >
            <span className="font-mono text-xs">{"</>"}</span>
          </BubbleBtn>
          <BubbleBtn
            active={editor.isActive("highlight")}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            label="Highlight"
          >
            <span className="text-xs">🖍</span>
          </BubbleBtn>
          <div className="w-px h-5 bg-[#2a2a2a] mx-0.5" />
          <BubbleBtn
            active={editor.isActive("link")}
            onClick={() => {
              const url = window.prompt("Enter URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              } else {
                editor.chain().focus().unsetLink().run();
              }
            }}
            label="Link"
          >
            🔗
          </BubbleBtn>
          <div className="w-px h-5 bg-[#2a2a2a] mx-0.5" />
          <div className="relative">
            <button
              onClick={() => setAiMenuOpen(!aiMenuOpen)}
              disabled={!!running}
              className={`px-2 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                aiMenuOpen
                  ? "bg-accent text-white"
                  : "text-accent hover:bg-accent/15"
              } ${running ? "opacity-50 cursor-wait" : ""}`}
              title="AI actions"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
              </svg>
              <span className="text-xs font-semibold">AI</span>
            </button>
            {aiMenuOpen && (
              <AIActionMenu
                onSelect={(action) => {
                  setAiMenuOpen(false);
                  runAction(action);
                }}
                onClose={() => setAiMenuOpen(false)}
              />
            )}
          </div>
        </BubbleMenu>
      )}
      {running && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-accent/40 rounded-lg shadow-2xl px-4 py-2 flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-300">
            AI is {running === "improve" ? "improving" : running === "shorten" ? "shortening" : running === "expand" ? "expanding" : running === "grammar" ? "fixing grammar in" : running === "formal" ? "formalizing" : running === "casual" ? "rephrasing" : "summarizing"} your selection...
          </span>
        </div>
      )}
      {(hasSuggestion || loadingSuggestion) && (
        <div className="absolute bottom-4 right-4 z-30 bg-surface/95 backdrop-blur border border-border rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1 text-[11px] text-gray-400">
          <span className="flex items-center gap-1 px-1.5 text-accent font-semibold">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
            </svg>
            AI
          </span>
          {loadingSuggestion && !hasSuggestion ? (
            <span className="flex items-center gap-1.5 px-1.5">
              <div className="w-2.5 h-2.5 border-[1.5px] border-accent border-t-transparent rounded-full animate-spin" />
              <span>Thinking...</span>
            </span>
          ) : (
            <>
              <span className="text-gray-700">·</span>
              <PillButton
                onClick={() => acceptRef.current()}
                title="Accept suggestion (Tab)"
              >
                <kbd className="px-1 py-0.5 bg-white/5 rounded border border-border font-mono text-[10px]">Tab</kbd>
                <span>Accept</span>
              </PillButton>
              <PillButton
                onClick={() => regenerateRef.current()}
                title="Generate a different suggestion (⌘/)"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0114.85-3.36L20 7M20 15a9 9 0 01-14.85 3.36L4 17" />
                </svg>
                <span>Try another</span>
              </PillButton>
              <PillButton
                onClick={() => dismissRef.current()}
                title="Dismiss (Esc)"
              >
                <span className="text-base leading-none">×</span>
              </PillButton>
            </>
          )}
        </div>
      )}
      <div className="flex justify-center py-10">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function AIActionMenu({
  onSelect,
  onClose,
}: {
  onSelect: (action: AIAction) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const actions: Array<{ id: AIAction; label: string; description: string; icon: string }> = [
    { id: "improve", label: "Improve writing", description: "Clearer, more polished", icon: "✨" },
    { id: "shorten", label: "Make shorter", description: "Tighten the prose", icon: "✂" },
    { id: "expand", label: "Make longer", description: "Add detail and context", icon: "📝" },
    { id: "grammar", label: "Fix grammar", description: "Correct spelling and syntax", icon: "✅" },
    { id: "formal", label: "More formal", description: "Professional tone", icon: "🎩" },
    { id: "casual", label: "More casual", description: "Conversational tone", icon: "💬" },
    { id: "summarize", label: "Summarize", description: "1–2 sentence summary", icon: "📋" },
  ];

  return (
    <div className="absolute top-full mt-1 left-0 w-64 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl py-1 z-50">
      {actions.map((a) => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        >
          <span className="shrink-0 w-7 h-7 rounded bg-white/5 border border-border flex items-center justify-center text-sm">
            {a.icon}
          </span>
          <div className="min-w-0">
            <div className="text-sm text-white font-medium leading-tight">{a.label}</div>
            <div className="text-[11px] text-gray-500 leading-tight mt-0.5">{a.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function PillButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1 px-1.5 py-1 rounded text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
    >
      {children}
    </button>
  );
}

function BubbleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active ? "bg-accent text-white" : "text-gray-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
