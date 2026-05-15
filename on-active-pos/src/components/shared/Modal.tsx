import type { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div 
        className="bg-[var(--pos-surface-elevated)] border border-[var(--pos-border)] rounded-[var(--pos-radius-lg)] w-full max-w-md flex flex-col shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--pos-border-subtle)]">
          <h2 className="text-xl font-semibold">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="text-[var(--pos-text-muted)] hover:text-white transition-colors">
              ✕
            </button>
          )}
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {children}
        </div>
        
        {footer && (
          <div className="p-6 border-t border-[var(--pos-border-subtle)] bg-[var(--pos-surface)] rounded-b-[var(--pos-radius-lg)] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
