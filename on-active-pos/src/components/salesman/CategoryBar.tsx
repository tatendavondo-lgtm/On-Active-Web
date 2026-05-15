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
            "h-10 px-6 rounded-full font-medium whitespace-nowrap transition-all select-none flex-shrink-0",
            activeId === c.id 
              ? "bg-[var(--pos-accent)] text-white shadow-lg shadow-[var(--pos-accent)]/20" 
              : "bg-[var(--pos-surface)] text-[var(--pos-text-muted)] border border-[var(--pos-border)] hover:bg-[var(--pos-surface-elevated)] hover:text-white"
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
