import { useState, useEffect } from 'react';
import { playNotificationSound } from '../../lib/notification';

interface PinPadProps {
  onSubmit: (pin: string) => void;
  loading?: boolean;
}

export function PinPad({ onSubmit, loading }: PinPadProps) {
  const [pin, setPin] = useState('');

  const handlePress = (num: string) => {
    playNotificationSound.tap();
    if (pin.length < 6) setPin(p => p + num);
  };

  const handleDelete = () => {
    playNotificationSound.tap();
    setPin(p => p.slice(0, -1));
  };

  const handleSubmit = () => {
    if (pin.length >= 4) {
      onSubmit(pin);
      setPin('');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading) return;
      
      // Let standard browser behaviors function if they aren't numbers/enter/backspace
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, loading]);

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 max-w-sm mx-auto">
      <div className="flex gap-3 sm:gap-4 mb-2 sm:mb-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
              i < pin.length 
                ? 'bg-[var(--pos-text-primary)] border-[var(--pos-text-primary)]' 
                : 'border-[var(--pos-border)] bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num)}
            disabled={loading}
            className="h-14 sm:h-16 md:h-20 text-2xl sm:text-3xl font-mono bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-[var(--pos-radius-lg)] transition-colors shadow-lg active:scale-95"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="h-14 sm:h-16 md:h-20 text-lg sm:text-xl font-medium bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-[var(--pos-radius-lg)] transition-colors text-[var(--pos-text-secondary)] shadow-lg active:scale-95"
        >
          CLR
        </button>
        <button
          onClick={() => handlePress('0')}
          disabled={loading}
          className="h-14 sm:h-16 md:h-20 text-2xl sm:text-3xl font-mono bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-[var(--pos-radius-lg)] transition-colors shadow-lg active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="h-14 sm:h-16 md:h-20 text-xl sm:text-2xl bg-[var(--pos-accent)] text-black hover:opacity-90 rounded-[var(--pos-radius-lg)] disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,33,0.3)] transition-all active:scale-95"
        >
          {loading ? '...' : '⏎'}
        </button>
      </div>
    </div>
  );
}
