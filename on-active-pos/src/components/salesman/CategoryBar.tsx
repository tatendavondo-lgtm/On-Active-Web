import { cn } from '../shared/Button';

interface CategoryBarProps {
  categories: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}

export function CategoryBar({ categories, activeId, onChange }: CategoryBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar hide-scroll-arrows">
      {categories.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "h-10 px-6 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all select-none flex-shrink-0 border",
            activeId === c.id 
              ? "bg-[var(--pos-accent)] text-black border-[var(--pos-accent)] shadow-lg shadow-[var(--pos-accent)]/15" 
              : "bg-[#111111] text-[var(--pos-text-muted)] border-white/5 hover:border-[var(--pos-accent)] hover:text-white"
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
