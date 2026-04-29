import { useState, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { marked } from "marked";
import { BACKEND_URL } from "../lib/constants";

export type DocAction =
  | "polish"
  | "structure"
  | "professional"
  | "concise"
  | "expand"
  | "summarize";

export interface DocActionState {
  running: DocAction | null;
  lastAction: DocAction | null;
  canUndo: boolean;
}

export function useAIDocument(editor: Editor | null) {
  const [running, setRunning] = useState<DocAction | null>(null);
  const [lastAction, setLastAction] = useState<DocAction | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const previousContent = useRef<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDocAction = useCallback(
    async (action: DocAction) => {
      if (!editor) return;
      const text = editor.getText();
      if (!text.trim()) {
        return { error: "Document is empty" };
      }

      setRunning(action);
      try {
        const res = await fetch(`${BACKEND_URL}/ai-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, text }),
        });
        if (!res.ok) throw new Error("Request failed");
        const data = (await res.json()) as { text?: string; error?: string };
        if (data.error || !data.text) {
          throw new Error(data.error ?? "Empty response");
        }

        previousContent.current = editor.getHTML();
        let markdown = data.text.trim();
        // Strip outer code fences if model still wraps the response
        if (markdown.startsWith("```")) {
          markdown = markdown.replace(/^```[a-z]*\n?/i, "").replace(/```\s*$/, "").trim();
        }
        const html = await marked.parse(markdown, { breaks: true, gfm: true });
        editor.commands.setContent(html, true);

        setLastAction(action);
        setCanUndo(true);

        if (undoTimer.current) clearTimeout(undoTimer.current);
        undoTimer.current = setTimeout(() => {
          setCanUndo(false);
          previousContent.current = null;
        }, 30_000);

        return { ok: true };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "AI request failed",
        };
      } finally {
        setRunning(null);
      }
    },
    [editor]
  );

  const undo = useCallback(() => {
    if (!editor || !previousContent.current) return;
    editor.commands.setContent(previousContent.current, true);
    setCanUndo(false);
    setLastAction(null);
    previousContent.current = null;
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [editor]);

  return { runDocAction, running, lastAction, canUndo, undo };
}
