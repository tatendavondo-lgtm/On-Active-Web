import { useState } from 'react';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  loading?: boolean;
}

export function PinPad({ onSubmit, loading }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handlePress = (num: string) => {
    if (pin.length < 6) setPin(p => p + num);
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const handleSubmit = () => {
    if (pin.length >= 4) {
      onSubmit(pin);
      setPin('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
      <div className="flex gap-4 mb-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${
              i < pin.length 
                ? 'bg-[var(--pos-text-primary)] border-[var(--pos-text-primary)]' 
                : 'border-[var(--pos-border)] bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            disabled={loading}
            className="h-20 text-3xl font-mono bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="h-20 text-xl font-medium bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all text-[var(--pos-text-secondary)]"
        >
          CLR
        </button>
        <button
          onClick={() => handlePress('0')}
          disabled={loading}
          className="h-20 text-3xl font-mono bg-[var(--pos-surface-elevated)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] active:scale-95 transition-all"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="h-20 text-2xl bg-[var(--pos-accent)] text-black hover:opacity-90 rounded-[var(--pos-radius)] active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? '...' : '⏎'}
        </button>
      </div>
    </div>
  );
}
