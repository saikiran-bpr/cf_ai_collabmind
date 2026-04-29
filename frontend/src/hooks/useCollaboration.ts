import { useEffect, useRef, useState, useMemo } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { WS_URL } from "../lib/constants";

interface UseCollaborationOptions {
  docId: string;
  sessionId: string;
  userId: string;
  userName: string;
  userColor: string;
}

export function useCollaboration({
  docId,
  sessionId,
  userId,
  userName,
  userColor,
}: UseCollaborationOptions) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const [connected, setConnected] = useState(false);

  const ydoc = useMemo(() => {
    if (!ydocRef.current) {
      ydocRef.current = new Y.Doc();
    }
    return ydocRef.current;
  }, []);

  useEffect(() => {
    if (!docId || !sessionId) return;

    if (providerRef.current) {
      providerRef.current.destroy();
    }

    const wsUrl = `${WS_URL}/doc`;
    const provider = new WebsocketProvider(wsUrl, docId, ydoc, {
      params: { session: sessionId },
      connect: true,
    });

    provider.on("status", ({ status }: { status: string }) => {
      setConnected(status === "connected");
    });

    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
      userId,
    });

    providerRef.current = provider;

    return () => {
      provider.destroy();
      providerRef.current = null;
    };
  }, [docId, sessionId, userId, userName, userColor, ydoc]);

  return {
    ydoc,
    provider: providerRef.current,
    connected,
  };
}
