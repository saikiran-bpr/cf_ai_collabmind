import { useState, useRef, useEffect } from "react";
import type { PresenceUser } from "../hooks/usePresence";
import type { Session } from "../hooks/useSession";

interface PresenceBarProps {
  users: PresenceUser[];
  localUserId: string;
  currentUser: Session;
  onSignOut: () => void;
}

export function PresenceBar({
  users,
  localUserId,
  currentUser,
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
    <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-white">
          <span className="text-accent">Collab</span>Mind
        </h1>
        <span className="text-gray-600">·</span>
        <div className="flex -space-x-2">
          {users.map((user) => (
            <UserAvatar key={user.userId} user={user} isLocal={user.userId === localUserId} />
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {users.length} {users.length === 1 ? "person" : "people"} editing
        </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 py-1 transition-colors"
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
              style={{ backgroundColor: currentUser.color, borderColor: currentUser.color }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <div className="text-xs text-white font-medium leading-tight">
              {currentUser.name}
            </div>
            {currentUser.email && (
              <div className="text-[10px] text-gray-500 leading-tight">
                {currentUser.email}
              </div>
            )}
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <div className="text-xs text-gray-400">Signed in as</div>
              <div className="text-sm text-white font-medium truncate">
                {currentUser.email ?? currentUser.name}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 capitalize">
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
  );
}

function UserAvatar({ user, isLocal }: { user: PresenceUser; isLocal: boolean }) {
  return (
    <div className="relative group">
      <div
        className={`w-8 h-8 rounded-full border-2 border-[#0f0f0f] flex items-center justify-center text-xs font-semibold text-white ${
          isLocal ? "ring-2 ring-accent ring-offset-1 ring-offset-[#0f0f0f]" : ""
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
