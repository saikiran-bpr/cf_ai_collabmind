import type { PresenceUser } from "../hooks/usePresence";

interface CursorsProps {
  users: PresenceUser[];
  localUserId: string;
}

export function Cursors({ users, localUserId }: CursorsProps) {
  const remoteUsers = users.filter((u) => u.userId !== localUserId);

  if (remoteUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-gray-400">
      {remoteUsers.map((user) => (
        <span
          key={user.userId}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{ backgroundColor: user.color + "20", color: user.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: user.color }}
          />
          {user.name}
        </span>
      ))}
    </div>
  );
}
