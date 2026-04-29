import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type * as Y from "yjs";
import type { PresenceUser } from "../hooks/usePresence";
import type { Session } from "../hooks/useSession";
import { DocumentTitle } from "./DocumentTitle";

interface PresenceBarProps {
  users: PresenceUser[];
  localUserId: string;
  currentUser: Session;
  ydoc: Y.Doc;
  onSignOut: () => void;
}

export function PresenceBar({
  users,
  localUserId,
  currentUser,
  ydoc,
  onSignOut,
}: PresenceBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-surface border-b border-border h-[49px]">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to="/"
          className="text-sm font-semibold shrink-0 hover:opacity-80 transition-opacity"
        >
          <span className="text-accent">Collab</span>Mind
        </Link>
        <span className="text-gray-700 shrink-0">/</span>
        <DocumentTitle ydoc={ydoc} />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex -space-x-2">
          {users.slice(0, 5).map((user) => (
            <UserAvatar
              key={user.userId}
              user={user}
              isLocal={user.userId === localUserId}
            />
          ))}
          {users.length > 5 && (
            <div className="w-7 h-7 rounded-full border-2 border-[#0f0f0f] bg-white/10 text-white text-[10px] font-semibold flex items-center justify-center">
              +{users.length - 5}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-1.5 py-1 transition-colors"
          >
            {currentUser.picture ? (
              <img
                src={currentUser.picture}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full border-2"
                style={{ borderColor: currentUser.color }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white border-2"
                style={{
                  backgroundColor: currentUser.color,
                  borderColor: currentUser.color,
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs text-gray-400">Signed in as</div>
                <div className="text-sm text-white font-medium truncate">
                  {currentUser.name}
                </div>
                {currentUser.email && (
                  <div className="text-[11px] text-gray-500 truncate mt-0.5">
                    {currentUser.email}
                  </div>
                )}
                <div className="text-[10px] text-gray-600 mt-1 capitalize">
                  via {currentUser.provider}
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onSignOut();
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserAvatar({
  user,
  isLocal,
}: {
  user: PresenceUser;
  isLocal: boolean;
}) {
  return (
    <div className="relative group">
      <div
        className={`w-7 h-7 rounded-full border-2 border-[#0f0f0f] flex items-center justify-center text-[10px] font-semibold text-white ${
          isLocal ? "ring-1 ring-accent ring-offset-1 ring-offset-[#0f0f0f]" : ""
        }`}
        style={{ backgroundColor: user.color }}
      >
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {user.name}
        {isLocal ? " (you)" : ""}
      </div>
    </div>
  );
}
