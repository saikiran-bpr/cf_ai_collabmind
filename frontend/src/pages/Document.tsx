import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import type { Editor as TipTapEditor } from "@tiptap/react";
import { Editor } from "../components/Editor";
import { Toolbar } from "../components/Toolbar";
import { PresenceBar } from "../components/PresenceBar";
import { StatusBar } from "../components/StatusBar";
import { AIChatPanel } from "../components/AIChatPanel";
import { SignInPanel } from "../components/SignInPanel";
import { useSession } from "../hooks/useSession";
import { useCollaboration } from "../hooks/useCollaboration";
import { usePresence } from "../hooks/usePresence";
import { useAI } from "../hooks/useAI";
import { useAIDocument } from "../hooks/useAIDocument";

export function Document() {
  const { docId } = useParams<{ docId: string }>();
  const {
    session,
    loading,
    authConfig,
    createGuestSession,
    signInWithGoogle,
    signOut,
  } = useSession();
  const [chatOpen, setChatOpen] = useState(false);
  const [editor, setEditor] = useState<TipTapEditor | null>(null);

  const { ydoc, provider, connected } = useCollaboration({
    docId: session ? (docId ?? "") : "",
    sessionId: session?.sessionId ?? "",
    userId: session?.userId ?? "",
    userName: session?.name ?? "",
    userColor: session?.color ?? "",
  });

  const { users } = usePresence(provider);
  const {
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
  } = useAI(editor);

  const [chatWidth, setChatWidth] = useState(() => {
    const saved = localStorage.getItem("collabmind-chat-width");
    return saved ? Math.max(280, Math.min(900, parseInt(saved, 10))) : 380;
  });
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(0);

  useEffect(() => {
    localStorage.setItem("collabmind-chat-width", String(chatWidth));
  }, [chatWidth]);

  function startChatResize(e: React.MouseEvent) {
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = chatWidth;

    function onMove(ev: MouseEvent) {
      const delta = dragStartXRef.current - ev.clientX;
      const next = Math.max(280, Math.min(900, dragStartWidthRef.current + delta));
      setChatWidth(next);
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }
  const {
    runDocAction,
    running: docActionRunning,
    canUndo,
    undo,
  } = useAIDocument(editor);

  const onEditorReady = useCallback((ed: TipTapEditor | null) => {
    setEditor(ed);
  }, []);

  useEffect(() => {
    if (docId) {
      document.title = `CollabMind — ${docId.slice(0, 8)}`;
    }
  }, [docId]);

  if (!docId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Invalid document ID
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading session...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <SignInPanel
        googleEnabled={authConfig.google}
        onGoogleSignIn={signInWithGoogle}
        onGuestSignIn={createGuestSession}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
      <PresenceBar
        users={users}
        localUserId={session.userId}
        currentUser={session}
        ydoc={ydoc}
        onSignOut={signOut}
      />

      <Toolbar
        editor={editor}
        onToggleChat={() => setChatOpen(!chatOpen)}
        chatOpen={chatOpen}
        onDocAction={runDocAction}
        docActionRunning={docActionRunning}
      />

      {docActionRunning && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-surface border border-accent/40 rounded-lg shadow-2xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-200">
            AI is rewriting your document...
          </span>
        </div>
      )}

      {canUndo && !docActionRunning && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded-lg shadow-2xl px-4 py-2.5 flex items-center gap-3 animate-[fadeIn_0.25s_ease]">
          <span className="text-sm text-white">Document rewritten by AI</span>
          <button
            onClick={undo}
            className="text-xs font-medium text-accent hover:underline"
          >
            Undo
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Editor
            ydoc={ydoc}
            provider={provider}
            userName={session.name}
            userColor={session.color}
            onEditorReady={onEditorReady}
            onAcceptSuggestion={acceptSuggestion}
            onDismissSuggestion={dismissSuggestion}
            onRegenerateSuggestion={regenerateSuggestion}
            hasSuggestion={hasSuggestion}
            loadingSuggestion={loadingSuggestion}
          />
        </div>

        {chatOpen && (
          <div
            className="shrink-0 border-l border-border relative"
            style={{ width: chatWidth }}
          >
            <div
              onMouseDown={startChatResize}
              className="absolute -left-1 top-0 bottom-0 w-2 cursor-col-resize z-30 hover:bg-accent/30 active:bg-accent/50 transition-colors group"
              title="Drag to resize"
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-border group-hover:bg-accent rounded-full transition-colors" />
            </div>
            <AIChatPanel
              messages={chatMessages}
              onSendAsk={sendChatMessage}
              onSendEdit={applyChatEdit}
              onUndoEdit={undoChatEdit}
              loading={chatLoading}
              onClose={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>

      <StatusBar
        editor={editor}
        provider={provider}
        connected={connected}
        onlineCount={users.length}
        docId={docId}
      />
    </div>
  );
}
