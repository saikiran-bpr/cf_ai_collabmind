import { useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "../lib/constants";

export interface Session {
  sessionId: string;
  userId: string;
  name: string;
  color: string;
  email?: string;
  picture?: string;
  provider: "google" | "guest";
}

export interface AuthConfig {
  google: boolean;
}

const STORAGE_KEY = "collabmind-session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authConfig, setAuthConfig] = useState<AuthConfig>({ google: false });

  useEffect(() => {
    fetch(`${BACKEND_URL}/auth/config`)
      .then((res) => res.json())
      .then((data: AuthConfig) => setAuthConfig(data))
      .catch(() => setAuthConfig({ google: false }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionFromUrl = params.get("session");
    let sessionToValidate: string | null = sessionFromUrl;

    if (sessionFromUrl) {
      localStorage.setItem(STORAGE_KEY, sessionFromUrl);
      params.delete("session");
      const newSearch = params.toString();
      const newPath =
        window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newPath);
    } else {
      sessionToValidate = localStorage.getItem(STORAGE_KEY);
    }

    if (!sessionToValidate) {
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/session/${sessionToValidate}`)
      .then((res) => {
        if (!res.ok) throw new Error("expired");
        return res.json();
      })
      .then((data: Session) => {
        setSession(data);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const createGuestSession = useCallback(
    async (name: string): Promise<Session> => {
      const res = await fetch(`${BACKEND_URL}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error("Failed to create session");

      const data = (await res.json()) as Session;
      localStorage.setItem(STORAGE_KEY, data.sessionId);
      setSession(data);
      return data;
    },
    []
  );

  const signInWithGoogle = useCallback(() => {
    const redirect = window.location.href.split("?")[0];
    const url = `${BACKEND_URL}/auth/google?redirect=${encodeURIComponent(redirect)}`;
    window.location.href = url;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  return {
    session,
    loading,
    authConfig,
    createGuestSession,
    signInWithGoogle,
    signOut,
  };
}
