import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

interface PluginState {
  suggestion: string;
}

const pluginKey = new PluginKey<PluginState>("inlineCompletion");

export function getInlineSuggestion(state: EditorState): string {
  return pluginKey.getState(state)?.suggestion ?? "";
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    inlineCompletion: {
      setInlineSuggestion: (suggestion: string) => ReturnType;
      clearInlineSuggestion: () => ReturnType;
      acceptInlineSuggestion: () => ReturnType;
    };
  }
}

export const InlineCompletion = Extension.create({
  name: "inlineCompletion",

  addProseMirrorPlugins() {
    return [
      new Plugin<PluginState>({
        key: pluginKey,
        state: {
          init: () => ({ suggestion: "" }),
          apply(tr, prev) {
            const meta = tr.getMeta(pluginKey);
            if (meta !== undefined) return meta as PluginState;
            if (tr.docChanged) return { suggestion: "" };
            return prev;
          },
        },
        props: {
          decorations(state) {
            const ps = pluginKey.getState(state);
            if (!ps?.suggestion) return DecorationSet.empty;

            const pos = state.selection.$head.pos;
            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement("span");
                span.className = "inline-ai-suggestion";
                span.textContent = ps.suggestion;
                span.setAttribute("data-suggestion", "true");
                return span;
              },
              { side: 1, ignoreSelection: true }
            );
            return DecorationSet.create(state.doc, [widget]);
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      setInlineSuggestion:
        (suggestion: string) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(pluginKey, { suggestion });
            dispatch(tr);
          }
          return true;
        },
      clearInlineSuggestion:
        () =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(pluginKey, { suggestion: "" });
            dispatch(tr);
          }
          return true;
        },
      acceptInlineSuggestion:
        () =>
        ({ tr, state, dispatch }) => {
          const ps = pluginKey.getState(state);
          const text = ps?.suggestion ?? "";
          if (!text) return false;
          if (dispatch) {
            tr.insertText(text);
            tr.setMeta(pluginKey, { suggestion: "" });
            dispatch(tr);
          }
          return true;
        },
    };
  },
});
