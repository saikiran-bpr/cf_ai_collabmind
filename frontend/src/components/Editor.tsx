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
import "tippy.js/dist/tippy.css";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";
import { useEffect } from "react";

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider | null;
  userName: string;
  userColor: string;
  onEditorReady: (editor: ReturnType<typeof useEditor>) => void;
  onAcceptSuggestion: () => void;
  onDismissSuggestion: () => void;
  hasSuggestion: boolean;
}

export function Editor({
  ydoc,
  provider,
  userName,
  userColor,
  onEditorReady,
  onAcceptSuggestion,
  onDismissSuggestion,
  hasSuggestion,
}: EditorProps) {
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
          if (hasSuggestion && event.key === "Tab") {
            event.preventDefault();
            onAcceptSuggestion();
            return true;
          }
          if (hasSuggestion && event.key === "Escape") {
            event.preventDefault();
            onDismissSuggestion();
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
        </BubbleMenu>
      )}
      <div className="flex justify-center py-10">
        <EditorContent editor={editor} />
      </div>
    </div>
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
