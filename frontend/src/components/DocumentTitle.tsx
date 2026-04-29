import { useState, useEffect, useMemo, useRef } from "react";
import type * as Y from "yjs";

interface DocumentTitleProps {
  ydoc: Y.Doc;
}

export function DocumentTitle({ ydoc }: DocumentTitleProps) {
  const meta = useMemo(() => ydoc.getMap("meta"), [ydoc]);
  const [value, setValue] = useState(() => (meta.get("title") as string) ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const observer = () => {
      const remote = (meta.get("title") as string) ?? "";
      if (remote !== inputRef.current?.value) {
        setValue(remote);
      }
    };
    meta.observe(observer);
    return () => meta.unobserve(observer);
  }, [meta]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    meta.set("title", next);
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={onChange}
      placeholder="Untitled document"
      className="bg-transparent text-white text-sm font-medium placeholder-gray-500 focus:outline-none focus:bg-white/5 px-2 py-1 rounded transition-colors min-w-[180px] max-w-md"
    />
  );
}
