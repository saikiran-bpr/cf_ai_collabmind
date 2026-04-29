import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import type { Editor, Range } from "@tiptap/core";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  keywords: string[];
  command: (params: { editor: Editor; range: Range }) => void;
}

export interface SlashCommandsMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandsMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandsMenu = forwardRef<
  SlashCommandsMenuRef,
  SlashCommandsMenuProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl p-2 text-xs text-gray-500 w-72">
        No matching commands
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-2xl py-1 w-72 max-h-80 overflow-y-auto">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={`w-full flex items-start gap-3 px-3 py-2 text-left transition-colors ${
            index === selectedIndex ? "bg-accent/15" : "hover:bg-white/5"
          }`}
        >
          <span className="shrink-0 w-8 h-8 rounded bg-white/5 border border-border flex items-center justify-center text-base">
            {item.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-white font-medium leading-tight">
              {item.title}
            </div>
            <div className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate">
              {item.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

SlashCommandsMenu.displayName = "SlashCommandsMenu";
