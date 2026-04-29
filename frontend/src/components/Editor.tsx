import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
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
          placeholder: "Start writing... your AI assistant is ready",
        }),
      ],
      editorProps: {
        attributes: {
          class: "focus:outline-none",
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
    <div className="tiptap-editor bg-white rounded-lg shadow-lg overflow-hidden">
      <EditorContent editor={editor} />
    </div>
  );
}
