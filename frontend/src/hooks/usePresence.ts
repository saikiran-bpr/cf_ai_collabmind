import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";

export interface PresenceUser {
  userId: string;
  name: string;
  color: string;
}

export function usePresence(provider: WebsocketProvider | null) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!provider) return;

    const awareness = provider.awareness;

    function updateUsers() {
      const states = awareness.getStates();
      const present: PresenceUser[] = [];
      states.forEach((state) => {
        if (state.user) {
          present.push({
            userId: state.user.userId ?? "unknown",
            name: state.user.name ?? "Anonymous",
            color: state.user.color ?? "#6366f1",
          });
        }
      });
      setUsers(present);
    }

    awareness.on("change", updateUsers);
    updateUsers();

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [provider]);

  return { users };
}
