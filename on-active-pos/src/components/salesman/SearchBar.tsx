import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
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
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-[var(--pos-text-muted)]" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        placeholder="Search products, SKU..."
        className="block w-full pl-11 pr-10 h-12 bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-full text-white placeholder-[var(--pos-text-muted)] focus:outline-none focus:border-[var(--pos-accent)] transition-colors"
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
