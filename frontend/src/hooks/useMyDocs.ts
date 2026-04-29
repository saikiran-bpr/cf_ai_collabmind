import { useState, useEffect, useCallback } from "react";
import { BACKEND_URL } from "../lib/constants";

export interface MyDoc {
  docId: string;
  title: string;
  role: "owner" | "shared";
  addedAt: number;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  lastModified: number;
}

export function useMyDocs(sessionId: string | null) {
  const [docs, setDocs] = useState<MyDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/my-docs`, {
        headers: { Authorization: `Bearer ${sessionId}` },
      });
      if (!res.ok) throw new Error("Failed to load documents");
      const data = (await res.json()) as { docs: MyDoc[] };
      setDocs(data.docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { docs, loading, error, refresh };
}
