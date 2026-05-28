import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[var(--pos-text-muted)]" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onChange(localValue);
            onSubmit?.();
          }
        }}
        placeholder="SEARCH PRODUCTS, SKU..."
        className="block w-full pl-12 pr-10 h-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-[var(--pos-accent)] focus:ring-1 focus:ring-[var(--pos-accent)] transition-all shadow-lg"
      />
      {localValue && (
        <button 
          onClick={() => setLocalValue('')}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--pos-text-muted)] hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
