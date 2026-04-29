interface AISuggestionProps {
  suggestion: string;
}

export function AISuggestion({ suggestion }: AISuggestionProps) {
  if (!suggestion) return null;

  return (
    <div className="ai-ghost-text bg-surface border border-accent/40 rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 backdrop-blur-sm">
      <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold bg-accent/20 text-accent px-2 py-1 rounded uppercase tracking-wide">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" />
        </svg>
        AI
      </div>
      <p className="flex-1 text-gray-300 italic leading-relaxed text-sm">
        {suggestion}
      </p>
      <div className="shrink-0 flex items-center gap-1 text-[10px] text-gray-500">
        <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-border font-mono">Tab</kbd>
        <span>accept</span>
        <span className="mx-1">·</span>
        <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-border font-mono">Esc</kbd>
        <span>dismiss</span>
      </div>
    </div>
  );
}
