import { useState, useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { BACKEND_URL, DEBOUNCE_AI_MS, MAX_CONTEXT_CHARS } from "../lib/constants";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function useAI(editor: Editor | null) {
  const [suggestion, setSuggestion] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I'm reading your document. Ask me anything about it.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!editor) return;

    function onUpdate() {
      setSuggestion("");

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        requestAISuggestion();
      }, DEBOUNCE_AI_MS);
    }

    function requestAISuggestion() {
      if (!editor) return;

      const text = editor.getText();
      if (text.length < 30) return;

      const { from } = editor.state.selection;
      const resolvedPos = editor.state.doc.resolve(from);
      const parentNode = resolvedPos.parent;
      const paragraphText = parentNode.textContent;

      if (paragraphText.trim().length < 10) return;

      const currentRequestId = ++requestIdRef.current;
      const context = text.slice(-MAX_CONTEXT_CHARS);

      fetch(`${BACKEND_URL}/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          paragraphContext: paragraphText.slice(-500),
          requestId: String(currentRequestId),
        }),
      })
        .then((res) => res.json())
        .then((data: { text?: string; requestId?: string }) => {
          if (Number(data.requestId) === requestIdRef.current && data.text) {
            setSuggestion(data.text);
          }
        })
        .catch(() => {});
    }

    editor.on("update", onUpdate);

    return () => {
      editor.off("update", onUpdate);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editor]);

  const acceptSuggestion = useCallback(() => {
    if (!editor || !suggestion) return;
    editor.chain().focus().insertContent(suggestion).run();
    setSuggestion("");
  }, [editor, suggestion]);

  const dismissSuggestion = useCallback(() => {
    setSuggestion("");
  }, []);

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!editor) return;

      const documentContext = editor.getText().slice(-MAX_CONTEXT_CHARS * 2);

      const userMessage: ChatMessage = { role: "user", content: message };
      setChatMessages((prev) => [...prev, userMessage]);
      setChatLoading(true);

      const conversationHistory = chatMessages.filter(
        (_, i) => i > 0
      );

      try {
        const response = await fetch(`${BACKEND_URL}/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            documentContext,
            conversationHistory,
          }),
        });

        if (!response.ok) {
          throw new Error("Chat request failed");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        let fullText = "";
        const decoder = new TextDecoder();

        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
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
                    };
                    return updated;
                  });
                }
              } catch {
                fullText += data;
                const captured = fullText;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: captured,
                  };
                  return updated;
                });
              }
            }
          }
        }
      } catch {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [editor, chatMessages]
  );

  return {
    suggestion,
    acceptSuggestion,
    dismissSuggestion,
    chatMessages,
    sendChatMessage,
    chatLoading,
  };
}
