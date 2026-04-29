import { Extension } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import tippy, { type Instance } from "tippy.js";
import {
  SlashCommandsMenu,
  type SlashCommandItem,
  type SlashCommandsMenuRef,
} from "../components/SlashCommandsMenu";

export const COMMAND_ITEMS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: "H₁",
    keywords: ["h1", "heading", "title"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: "H₂",
    keywords: ["h2", "heading", "subtitle"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: "H₃",
    keywords: ["h3", "heading"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Paragraph",
    description: "Plain text",
    icon: "¶",
    keywords: ["text", "paragraph", "p"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("paragraph").run();
    },
  },
  {
    title: "Bullet list",
    description: "Unordered list",
    icon: "•",
    keywords: ["bullet", "list", "ul"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered list",
    description: "Ordered list",
    icon: "1.",
    keywords: ["numbered", "ordered", "list", "ol"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task list",
    description: "Checklist with checkboxes",
    icon: "☐",
    keywords: ["task", "todo", "checkbox", "checklist"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quotation",
    icon: "❝",
    keywords: ["quote", "blockquote"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code block",
    description: "Multi-line code with monospace font",
    icon: "{}",
    keywords: ["code", "block", "monospace"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Divider",
    description: "Horizontal line",
    icon: "—",
    keywords: ["divider", "separator", "hr", "line"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

function filterItems(query: string): SlashCommandItem[] {
  if (!query) return COMMAND_ITEMS;
  const q = query.toLowerCase();
  return COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
  );
}

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        allowSpaces: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => filterItems(query),
        render: () => {
          let component: ReactRenderer<SlashCommandsMenuRef> | null = null;
          let popup: Instance[] | null = null;

          return {
            onStart: (props: {
              editor: Editor;
              clientRect?: (() => DOMRect | null) | null;
            }) => {
              component = new ReactRenderer(SlashCommandsMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy("body", {
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(0, 0, 0, 0),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
              });
            },

            onUpdate(props: {
              clientRect?: (() => DOMRect | null) | null;
            }) {
              component?.updateProps(props);
              if (!props.clientRect || !popup) return;
              popup[0].setProps({
                getReferenceClientRect: () =>
                  props.clientRect?.() ?? new DOMRect(0, 0, 0, 0),
              });
            },

            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === "Escape") {
                popup?.[0].hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit() {
              popup?.[0].destroy();
              component?.destroy();
              popup = null;
              component = null;
            },
          };
        },
      }),
    ];
  },
});
