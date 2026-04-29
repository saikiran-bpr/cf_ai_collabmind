import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../lib/constants";
import { useSession } from "../hooks/useSession";
import { useMyDocs, type MyDoc } from "../hooks/useMyDocs";
import { SignInPanel } from "../components/SignInPanel";

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function Home() {
  const navigate = useNavigate();
  const {
    session,
    loading,
    authConfig,
    createGuestSession,
    signInWithGoogle,
    signOut,
  } = useSession();
  const { docs, loading: docsLoading, refresh } = useMyDocs(
    session?.sessionId ?? null
  );
  const [joinId, setJoinId] = useState("");
  const [creating, setCreating] = useState(false);

  async function createDocument() {
    if (!session) return;
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.sessionId}` },
      });
      if (!res.ok) throw new Error("create failed");
      const data: { docId: string } = await res.json();
      await refresh();
      navigate(`/doc/${data.docId}`);
    } catch {
      alert("Failed to create document. Is the backend running?");
    } finally {
      setCreating(false);
    }
  }

  function joinDocument(e: React.FormEvent) {
    e.preventDefault();
    const id = joinId.trim();
    if (id) navigate(`/doc/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading...
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

  const ownerDocs = docs.filter((d) => d.role === "owner");
  const sharedDocs = docs.filter((d) => d.role === "shared");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border sticky top-0 bg-[#0f0f0f] z-10">
        <h1 className="text-sm font-semibold">
          <span className="text-accent">Collab</span>Mind
        </h1>
        <div className="flex items-center gap-3">
          {session.picture ? (
            <img
              src={session.picture}
              alt={session.name}
              className="w-7 h-7 rounded-full border-2"
              style={{ borderColor: session.color }}
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: session.color }}
            >
              {session.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-right hidden sm:block">
            <div className="text-xs text-white font-medium leading-tight">
              {session.name}
            </div>
            {session.email && (
              <div className="text-[10px] text-gray-500 leading-tight">
                {session.email}
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-10">
        <section className="space-y-4">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Welcome back, {session.name.split(" ")[0]} 👋
            </h2>
            <p className="text-gray-400 mt-1 text-sm">
              Real-time collaborative writing with AI assistance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={createDocument}
              disabled={creating}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {creating ? "Creating..." : "New Document"}
            </button>
            <form onSubmit={joinDocument} className="flex gap-2 flex-1">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Or paste a document ID to join..."
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={!joinId.trim()}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-sm font-medium px-5 py-3 rounded-lg transition-colors"
              >
                Join
              </button>
            </form>
          </div>
        </section>

        {docsLoading && docs.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {ownerDocs.length > 0 && (
              <DocsSection
                title="Your documents"
                docs={ownerDocs}
                onOpen={(id) => navigate(`/doc/${id}`)}
              />
            )}
            {sharedDocs.length > 0 && (
              <DocsSection
                title="Shared with you"
                docs={sharedDocs}
                onOpen={(id) => navigate(`/doc/${id}`)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function DocsSection({
  title,
  docs,
  onOpen,
}: {
  title: string;
  docs: MyDoc[];
  onOpen: (docId: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-xs text-gray-500">{docs.length}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {docs.map((doc) => (
          <DocCard key={doc.docId} doc={doc} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function DocCard({
  doc,
  onOpen,
}: {
  doc: MyDoc;
  onOpen: (docId: string) => void;
}) {
  return (
    <button
      onClick={() => onOpen(doc.docId)}
      className="text-left bg-surface border border-border hover:border-accent/50 rounded-xl p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-accent"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-white font-medium truncate text-sm">
              {doc.title || "Untitled"}
            </h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Edited {timeAgo(doc.lastModified)}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide shrink-0 ${
            doc.role === "owner"
              ? "bg-accent/20 text-accent"
              : "bg-white/5 text-gray-400 border border-border"
          }`}
        >
          {doc.role}
        </span>
      </div>
      {doc.role === "shared" && (
        <p className="text-[11px] text-gray-500 mt-1">
          Created by {doc.createdByName}
        </p>
      )}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="bg-surface/50 border border-dashed border-border rounded-2xl p-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/10 mb-3">
        <svg
          className="w-6 h-6 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h3 className="text-white font-semibold text-base">No documents yet</h3>
      <p className="text-gray-500 text-sm mt-1">
        Create your first document to get started
      </p>
    </div>
  );
}
