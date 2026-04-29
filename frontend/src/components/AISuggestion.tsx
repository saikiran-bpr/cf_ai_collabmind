interface AISuggestionProps {
  suggestion: string;
}

export function AISuggestion({ suggestion }: AISuggestionProps) {
  if (!suggestion) return null;

  return (
    <div className="ai-ghost-text px-8 py-2 flex items-start gap-2">
      <span className="shrink-0 text-[10px] font-semibold bg-accent/20 text-accent px-1.5 py-0.5 rounded mt-0.5">
        AI
      </span>
      <span className="text-gray-500 italic leading-relaxed">
        {suggestion}
      </span>
      <span className="shrink-0 text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded border border-border mt-0.5">
        Tab ↵
      </span>
    </div>
  );
}
