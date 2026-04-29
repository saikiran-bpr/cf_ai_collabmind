import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../lib/constants";
import { useSession } from "../hooks/useSession";
import { SignInPanel } from "../components/SignInPanel";

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
  const [joinId, setJoinId] = useState("");
  const [creating, setCreating] = useState(false);

  async function createDocument() {
    setCreating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/create`, { method: "POST" });
      const data: { docId: string } = await res.json();
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
    if (id) {
      navigate(`/doc/${id}`);
    }
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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
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
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold">
              <span className="text-accent">Collab</span>Mind
            </h1>
            <p className="text-gray-400 text-lg">
              Welcome back, {session.name.split(" ")[0]}.
              <br />
              Real-time collaborative writing with AI assistance.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={createDocument}
              disabled={creating}
              className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              {creating ? "Creating..." : "Create New Document"}
            </button>

            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <div className="flex-1 h-px bg-border" />
              or
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={joinDocument} className="flex gap-2">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="Paste a document ID to join..."
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={!joinId.trim()}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg
                className="w-4 h-4"
                viewBox="0 0 128 128"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0z"
                  fill="#F38020"
                />
                <path
                  d="M93.5 67.4c-.6-2-2.4-3.4-4.5-3.4H52.7l-1.3-4.3c-.3-1-.2-2.1.3-3 .5-.9 1.3-1.6 2.3-1.9l31.7-9.5c1.1-.3 1.7-1.5 1.4-2.6-.3-1.1-1.5-1.7-2.6-1.4L52.8 51c-2 .6-3.6 2-4.5 3.8-.9 1.8-1.1 3.9-.5 5.9l5.9 19.4c.4 1.4 1.7 2.4 3.2 2.4h33.8c2.1 0 3.9-1.4 4.5-3.4l3.5-11.7z"
                  fill="white"
                />
              </svg>
              <span>Built on Cloudflare</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
