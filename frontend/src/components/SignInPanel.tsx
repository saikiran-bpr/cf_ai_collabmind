import { useState } from "react";

interface SignInPanelProps {
  googleEnabled: boolean;
  onGoogleSignIn: () => void;
  onGuestSignIn: (name: string) => Promise<unknown>;
}

export function SignInPanel({
  googleEnabled,
  onGoogleSignIn,
  onGuestSignIn,
}: SignInPanelProps) {
  const [showGuest, setShowGuest] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onGuestSignIn(name.trim());
    } catch {
      setError("Failed to create session. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm w-full space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 mb-2">
            <svg
              className="w-7 h-7 text-accent"
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
          <h2 className="text-2xl font-semibold text-white">
            Welcome to <span className="text-accent">CollabMind</span>
          </h2>
          <p className="text-gray-400 text-sm">
            Sign in to start collaborating
          </p>
        </div>

        {!showGuest ? (
          <div className="space-y-3">
            {googleEnabled && (
              <button
                onClick={onGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 rounded-lg transition-colors shadow-sm"
              >
                <GoogleIcon />
                Continue with Google
              </button>
            )}

            <button
              onClick={() => setShowGuest(true)}
              className="w-full bg-white/5 hover:bg-white/10 border border-border text-white font-medium py-3 rounded-lg transition-colors"
            >
              Continue as guest
            </button>

            {!googleEnabled && (
              <p className="text-xs text-gray-500 text-center pt-2">
                Google sign-in not configured. See README.md
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleGuest} className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">
                Display name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name..."
                autoFocus
                className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowGuest(false)}
                className="px-4 py-3 text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="flex-1 bg-accent hover:bg-accent/90 disabled:opacity-40 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? "Joining..." : "Join Document"}
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-gray-500 text-center">
          Your session is stored securely in Cloudflare KV
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
