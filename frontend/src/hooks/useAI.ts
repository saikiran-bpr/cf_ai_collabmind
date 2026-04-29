import { useState, useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { marked } from "marked";
import { BACKEND_URL, DEBOUNCE_AI_MS, MAX_CONTEXT_CHARS } from "../lib/constants";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  kind?: "text" | "edit-applied" | "edit-failed";
  undoSnapshot?: string;
  streaming?: boolean;
}

export function useAI(editor: Editor | null) {
  const [hasSuggestion, setHasSuggestion] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I'm reading your document. Ask me anything about it.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const lastSuggestionRef = useRef("");
  const lastContextRef = useRef("");

  const fetchSuggestion = useCallback(
    async (regenerate = false) => {
      if (!editor) return;

      const text = editor.getText();
      const { from } = editor.state.selection;
      const resolvedPos = editor.state.doc.resolve(from);
      const paragraphText = resolvedPos.parent.textContent;

      if (regenerate) {
        if (!lastContextRef.current) return;
      } else {
        if (text.length < 30) return;
        if (paragraphText.trim().length < 10) return;
      }

      const context = regenerate
        ? lastContextRef.current
        : paragraphText.slice(-500);
      lastContextRef.current = context;

      const currentRequestId = ++requestIdRef.current;
      setLoadingSuggestion(true);

      try {
        const res = await fetch(`${BACKEND_URL}/ai-suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: text.slice(-MAX_CONTEXT_CHARS),
            paragraphContext: context,
            requestId: String(currentRequestId),
            exclude: regenerate ? lastSuggestionRef.current : undefined,
          }),
        });
        const data = (await res.json()) as { text?: string; requestId?: string };

        if (Number(data.requestId) !== requestIdRef.current) return;

        if (data.text) {
          lastSuggestionRef.current = data.text;
          editor.commands.setInlineSuggestion(data.text);
          setHasSuggestion(true);
        }
      } catch {
        /* swallow */
      } finally {
        if (Number(currentRequestId) === requestIdRef.current) {
          setLoadingSuggestion(false);
        }
      }
    },
    [editor]
  );

  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      setHasSuggestion(false);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => fetchSuggestion(false), DEBOUNCE_AI_MS);
    };

    const onSelectionUpdate = () => {
      // Cursor moved — drop the current suggestion (it was for the old position)
      setHasSuggestion(false);
      editor.commands.clearInlineSuggestion();
    };

    editor.on("update", onUpdate);
    editor.on("selectionUpdate", onSelectionUpdate);

    return () => {
      editor.off("update", onUpdate);
      editor.off("selectionUpdate", onSelectionUpdate);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [editor, fetchSuggestion]);

  const acceptSuggestion = useCallback(() => {
    if (!editor) return;
    editor.commands.acceptInlineSuggestion();
    setHasSuggestion(false);
  }, [editor]);

  const dismissSuggestion = useCallback(() => {
    if (!editor) return;
    editor.commands.clearInlineSuggestion();
    setHasSuggestion(false);
  }, [editor]);

  const regenerateSuggestion = useCallback(() => {
    if (!editor) return;
    editor.commands.clearInlineSuggestion();
    setHasSuggestion(false);
    fetchSuggestion(true);
  }, [editor, fetchSuggestion]);

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!editor) return;

      const documentContext = editor.getText().slice(-MAX_CONTEXT_CHARS * 2);
      const userMessage: ChatMessage = { role: "user", content: message };
      setChatMessages((prev) => [...prev, userMessage]);
      setChatLoading(true);

      const conversationHistory = chatMessages.filter((_, i) => i > 0);

      try {
        const response = await fetch(`${BACKEND_URL}/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, documentContext, conversationHistory }),
        });
        if (!response.ok) throw new Error("Chat request failed");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let fullText = "";
        const decoder = new TextDecoder();

        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", streaming: true },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.response) {
                fullText += parsed.response;
                const captured = fullText;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: captured,
                    streaming: true,
                  };
                  return updated;
                });
              }
            } catch {
              fullText += data;
              const captured = fullText;
              setChatMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: captured };
                return updated;
              });
            }
          }
        }
        // Mark streaming complete
        setChatMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      } catch {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [editor, chatMessages]
  );

  const applyChatEdit = useCallback(
    async (instruction: string) => {
      if (!editor) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: instruction,
        kind: "text",
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setChatLoading(true);

      const previousContent = editor.getHTML();
      const documentContent = editor.getText().slice(0, 5000);
      const conversationHistory = chatMessages.filter((_, i) => i > 0);

      try {
        const res = await fetch(`${BACKEND_URL}/ai-chat-edit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instruction,
            documentContent,
            conversationHistory,
          }),
        });
        if (!res.ok) throw new Error("Edit request failed");
        const data = (await res.json()) as { markdown?: string; error?: string };
        if (data.error || !data.markdown) {
          throw new Error(data.error ?? "Empty response");
        }

        const html = await marked.parse(data.markdown, { breaks: true, gfm: true });
        editor.commands.setContent(html, true);

        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I've updated your document. Click **Undo** to revert.",
            kind: "edit-applied",
            undoSnapshot: previousContent,
          },
        ]);
      } catch {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't apply that edit. Please try again.",
            kind: "edit-failed",
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [editor, chatMessages]
  );

  const undoChatEdit = useCallback(
    (snapshot: string) => {
      if (!editor) return;
      editor.commands.setContent(snapshot, true);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Reverted." },
      ]);
    },
    [editor]
  );

  return {
    hasSuggestion,
    loadingSuggestion,
    acceptSuggestion,
    dismissSuggestion,
    regenerateSuggestion,
    chatMessages,
    sendChatMessage,
    applyChatEdit,
    undoChatEdit,
    chatLoading,
  };
}
