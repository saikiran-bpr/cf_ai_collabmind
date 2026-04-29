import { useState } from "react";

interface LandingProps {
  googleEnabled: boolean;
  onGoogleSignIn: () => void;
  onGuestSignIn: (name: string) => Promise<unknown>;
}

export function Landing({
  googleEnabled,
  onGoogleSignIn,
  onGuestSignIn,
}: LandingProps) {
  const [showGuest, setShowGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestError, setGuestError] = useState("");
  const [guestLoading, setGuestLoading] = useState(false);

  async function submitGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    setGuestError("");
    setGuestLoading(true);
    try {
      await onGuestSignIn(guestName.trim());
    } catch {
      setGuestError("Couldn't start a session. Is the backend running?");
    } finally {
      setGuestLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-purple-600/30 rounded-full blur-[120px]" />
        <div className="absolute top-[-10%] right-[5%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative">
        {/* Nav */}
        <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-base font-semibold">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
              </svg>
            </div>
            <span>
              <span className="text-accent">Collab</span>Mind
            </span>
          </div>
          <button
            onClick={() => setShowGuest(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign in →
          </button>
        </nav>

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-[12px] text-purple-200 font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Powered by Cloudflare Workers AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white leading-[1.05]">
            Write together,
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              think smarter.
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            A real-time collaborative document editor with an AI that suggests
            as you type, edits on command, and chats with full context of your
            document.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            {googleEnabled && (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            )}
            <button
              onClick={() => setShowGuest(true)}
              className="bg-white/5 hover:bg-white/10 border border-border text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try as guest →
            </button>
          </div>

          <p className="mt-6 text-xs text-gray-600">
            Free · No credit card · 24-hour guest sessions
          </p>
        </section>

        {/* AI Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] text-accent font-bold uppercase tracking-wider mb-3">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
              </svg>
              AI features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              An AI that actually understands your document
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Five integrated AI capabilities that go beyond autocomplete.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              gradient="from-purple-500/20 to-indigo-500/20"
              borderGradient="from-purple-400/30 to-indigo-400/30"
              icon="✨"
              title="Inline completions"
              description="Pause for two seconds and AI suggests the next sentence as ghost text. Tab to accept, Cmd+/ for an alternative — just like Copilot for prose."
            />
            <FeatureCard
              gradient="from-blue-500/20 to-cyan-500/20"
              borderGradient="from-blue-400/30 to-cyan-400/30"
              icon="💬"
              title="Chat with your doc"
              description="Ask questions about what you've written. The AI streams answers with full context — summarize sections, find contradictions, or get specific quotes."
            />
            <FeatureCard
              gradient="from-pink-500/20 to-rose-500/20"
              borderGradient="from-pink-400/30 to-rose-400/30"
              icon="✏️"
              title="Edit by chat"
              description='Tell the AI to "add a conclusion" or "remove the third paragraph" — and it rewrites your document. Every edit is undoable.'
            />
            <FeatureCard
              gradient="from-amber-500/20 to-orange-500/20"
              borderGradient="from-amber-400/30 to-orange-400/30"
              icon="🛠️"
              title="Whole-doc tools"
              description="One-click polish, restructure, professional rewrite, concise mode, expand with detail, or summarize — applied across the entire document."
            />
            <FeatureCard
              gradient="from-green-500/20 to-emerald-500/20"
              borderGradient="from-green-400/30 to-emerald-400/30"
              icon="🎯"
              title="Selection actions"
              description="Highlight any text and pick: improve, shorten, expand, fix grammar, formal, casual, or summarize. The AI replaces the selection in place."
            />
            <FeatureCard
              gradient="from-fuchsia-500/20 to-purple-500/20"
              borderGradient="from-fuchsia-400/30 to-purple-400/30"
              icon="⚡"
              title="Slash commands"
              description="Type / anywhere to insert headings, lists, code blocks, quotes, dividers — Notion-style block menu, no toolbar hunting."
            />
          </div>
        </section>

        {/* Realtime + Cloudflare */}
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center bg-gradient-to-br from-surface to-surface/40 border border-border rounded-2xl p-8">
            <div>
              <h3 className="text-2xl font-bold text-white">
                Built for real-time collaboration
              </h3>
              <p className="mt-3 text-gray-400">
                Conflict-free CRDT editing means edits never collide. Live cursors, presence avatars, and instant sync — all on Cloudflare's global edge.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm text-gray-300">
                <ListItem>Multi-user editing with live cursors and selections</ListItem>
                <ListItem>Edits persist forever — even when everyone disconnects</ListItem>
                <ListItem>Sub-100ms sync via Durable Objects</ListItem>
                <ListItem>Google sign-in or guest mode</ListItem>
              </ul>
            </div>
            <div className="bg-[#0a0a0a] rounded-xl border border-border p-5 font-mono text-xs space-y-1 shadow-xl">
              <div className="text-gray-500">// architecture</div>
              <div className="text-gray-300">
                <span className="text-purple-400">React</span> + <span className="text-blue-400">TipTap</span> + <span className="text-cyan-400">Yjs</span>
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400">Cloudflare</span> Workers
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400">Durable Objects</span> per document
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400">Workers AI</span> — Llama 3.1 8B
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400">KV</span> sessions, AI Gateway
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to write smarter?
          </h2>
          <p className="mt-3 text-gray-400">
            Create a document in 5 seconds. No setup. No credit card.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {googleEnabled && (
              <button
                onClick={onGoogleSignIn}
                className="flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                <GoogleIcon />
                Sign in with Google
              </button>
            )}
            <button
              onClick={() => setShowGuest(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg shadow-purple-500/30"
            >
              Get started as guest →
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
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
          <div>© CollabMind</div>
        </footer>
      </div>

      {/* Guest sign-in modal */}
      {showGuest && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 animate-[fadeIn_0.15s_ease]"
          onClick={() => setShowGuest(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface border border-border rounded-2xl p-7 max-w-sm w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Continue as guest
              </h3>
              <button
                onClick={() => setShowGuest(false)}
                className="text-gray-500 hover:text-gray-300 w-7 h-7 flex items-center justify-center rounded hover:bg-white/5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Pick a display name. Your session lasts 24 hours.
            </p>
            <form onSubmit={submitGuest} className="space-y-3">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name..."
                autoFocus
                className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent transition-colors"
              />
              {guestError && (
                <p className="text-red-400 text-sm">{guestError}</p>
              )}
              {googleEnabled && (
                <>
                  <button
                    type="button"
                    onClick={onGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-medium py-2.5 rounded-lg transition-colors"
                  >
                    <GoogleIcon />
                    Or continue with Google
                  </button>
                  <div className="text-[10px] text-gray-600 text-center">— or —</div>
                </>
              )}
              <button
                type="submit"
                disabled={!guestName.trim() || guestLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-purple-500/30 disabled:shadow-none"
              >
                {guestLoading ? "Starting..." : "Start writing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  gradient,
  borderGradient,
  icon,
  title,
  description,
}: {
  gradient: string;
  borderGradient: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={`relative bg-gradient-to-br ${gradient} border border-transparent rounded-xl p-5 transition-all hover:scale-[1.02] hover:shadow-xl group overflow-hidden`}
      style={{
        backgroundClip: "padding-box",
      }}
    >
      <div
        className={`absolute inset-0 rounded-xl bg-gradient-to-br ${borderGradient} opacity-0 group-hover:opacity-100 transition-opacity -z-10`}
        style={{ padding: "1px", margin: "-1px" }}
      />
      <div className="relative">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="text-base font-semibold text-white mb-1.5">{title}</h3>
        <p className="text-[13px] text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className="w-4 h-4 text-green-400 mt-0.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      {children}
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
