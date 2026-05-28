import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
          <motion.button
            key={num}
            whileTap={{ scale: 0.92 }}
            onClick={() => handlePress(num)}
            disabled={loading}
            className="h-20 text-3xl font-mono bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-[var(--pos-radius-lg)] transition-colors shadow-lg"
          >
            {num}
          </motion.button>
        ))}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleDelete}
          disabled={loading}
          className="h-20 text-xl font-medium bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-[var(--pos-radius-lg)] transition-colors text-[var(--pos-text-secondary)] shadow-lg"
        >
          CLR
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handlePress('0')}
          disabled={loading}
          className="h-20 text-3xl font-mono bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-[var(--pos-radius-lg)] transition-colors shadow-lg"
        >
          0
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSubmit}
          disabled={loading || pin.length < 4}
          className="h-20 text-2xl bg-[var(--pos-accent)] text-black hover:opacity-90 rounded-[var(--pos-radius-lg)] disabled:opacity-50 shadow-[0_0_20px_rgba(197,160,33,0.3)] transition-all"
        >
          {loading ? '...' : '⏎'}
        </motion.button>
      </div>
    </div>
  );
}
