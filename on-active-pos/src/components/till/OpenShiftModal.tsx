import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Numpad } from '../shared/Numpad';

interface OpenShiftModalProps {
  isOpen: boolean;
  onOpen: (openingCash: number) => void;
}

export function OpenShiftModal({ isOpen, onOpen }: OpenShiftModalProps) {
  const [openingCash, setOpeningCash] = useState('');
  
  const handleOpen = () => {
    const amount = parseFloat(openingCash);
    if (isNaN(amount)) return;
    onOpen(amount);
  };

  return (
    <Modal isOpen={isOpen} title="Open New Shift">
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-[var(--pos-text-secondary)] text-sm mb-4">
            Enter the starting cash float in the drawer (USD)
          </p>
          <div className="text-4xl font-mono font-bold bg-[var(--pos-surface)] p-4 rounded border border-[var(--pos-border)] mb-6">
            ${openingCash || '0.00'}
          </div>
        </div>

        <div className="flex justify-center">
          <Numpad 
            onValueChange={setOpeningCash} 
          />
        </div>

        <div className="flex gap-4 mt-8">
          <Button 
            variant="primary" 
            className="flex-1 h-14 text-lg" 
            onClick={handleOpen}
            disabled={!openingCash}
          >
            Open Shift
          </Button>
        </div>
      </div>
    </Modal>
  );
}
