import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { BACKEND_URL } from "../lib/constants";

export type AIAction =
  | "improve"
  | "shorten"
  | "expand"
  | "grammar"
  | "formal"
  | "casual"
  | "summarize";

export function useAIActions(editor: Editor | null) {
  const [running, setRunning] = useState<AIAction | null>(null);
  const [error, setError] = useState("");

  const runAction = useCallback(
    async (action: AIAction) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from === to) return;

      const selectedText = editor.state.doc.textBetween(from, to, "\n");
      if (!selectedText.trim()) return;

      setRunning(action);
      setError("");

      try {
        const res = await fetch(`${BACKEND_URL}/ai-action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, text: selectedText }),
        });
        if (!res.ok) throw new Error("AI request failed");
        const data = (await res.json()) as { text?: string };
        if (data.text) {
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContent(data.text)
            .run();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "AI failed");
        setTimeout(() => setError(""), 4000);
      } finally {
        setRunning(null);
      }
    },
    [editor]
  );

  return { runAction, running, error };
}
