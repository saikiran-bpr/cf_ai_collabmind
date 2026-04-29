import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import type { Editor as TipTapEditor } from "@tiptap/react";
import { Editor } from "../components/Editor";
import { Toolbar } from "../components/Toolbar";
import { PresenceBar } from "../components/PresenceBar";
import { AISuggestion } from "../components/AISuggestion";
import { AIChatPanel } from "../components/AIChatPanel";
import { SignInPanel } from "../components/SignInPanel";
import { useSession } from "../hooks/useSession";
import { useCollaboration } from "../hooks/useCollaboration";
import { usePresence } from "../hooks/usePresence";
import { useAI } from "../hooks/useAI";

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
    suggestion,
    acceptSuggestion,
    dismissSuggestion,
    chatMessages,
    sendChatMessage,
    chatLoading,
  } = useAI(editor);

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
    <div className="min-h-screen flex flex-col">
      <PresenceBar
        users={users}
        localUserId={session.userId}
        currentUser={session}
        onSignOut={signOut}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          <Toolbar
            editor={editor}
            connected={connected}
            onToggleChat={() => setChatOpen(!chatOpen)}
            chatOpen={chatOpen}
          />
          <Editor
            ydoc={ydoc}
            provider={provider}
            userName={session.name}
            userColor={session.color}
            onEditorReady={onEditorReady}
            onAcceptSuggestion={acceptSuggestion}
            onDismissSuggestion={dismissSuggestion}
            hasSuggestion={!!suggestion}
          />
          <AISuggestion suggestion={suggestion} />
        </div>

        {chatOpen && (
          <div className="w-80 shrink-0 h-[calc(100vh-65px)]">
            <AIChatPanel
              messages={chatMessages}
              onSend={sendChatMessage}
              loading={chatLoading}
              onClose={() => setChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
