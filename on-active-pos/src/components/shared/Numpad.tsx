import { useState } from 'react';
import { Delete } from 'lucide-react';

interface NumpadProps {
  onValueChange: (val: string) => void;
  onSubmit?: (val: string) => void;
  maxLength?: number;
}

export function Numpad({ onValueChange, onSubmit, maxLength = 8 }: NumpadProps) {
  const [value, setValue] = useState('');

  const handlePress = (num: string) => {
    if (value.length >= maxLength) return;
    if (num === '.' && value.includes('.')) return;
    if (num === '.' && value === '') {
      const next = '0.';
      setValue(next);
      onValueChange(next);
      return;
    }
    
    const next = value + num;
    setValue(next);
    onValueChange(next);
  };

  const handleDelete = () => {
    const next = value.slice(0, -1);
    setValue(next);
    onValueChange(next);
  };

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px]">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
        <button
          key={num}
          onClick={() => handlePress(num)}
          className="h-16 text-2xl font-mono bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all text-white border border-[var(--pos-border)]"
        >
          {num}
        </button>
      ))}
      <button
        onClick={() => handlePress('.')}
        className="h-16 text-2xl font-mono bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all text-white border border-[var(--pos-border)]"
      >
        .
      </button>
      <button
        onClick={() => handlePress('0')}
        className="h-16 text-2xl font-mono bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all text-white border border-[var(--pos-border)]"
      >
        0
      </button>
      <button
        onClick={handleDelete}
        className="h-16 flex items-center justify-center bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all text-[var(--pos-text-muted)] border border-[var(--pos-border)]"
      >
        <Delete className="w-6 h-6" />
      </button>
      {onSubmit && (
        <button
          onClick={() => onSubmit(value)}
          className="col-span-3 h-16 bg-[var(--pos-accent)] text-black font-bold rounded-[var(--pos-radius)] active:scale-95 transition-all mt-2"
        >
          Enter
        </button>
      )}
    </div>
  );
}
