import type { ReactNode } from 'react';
import { playNotificationSound } from '../../lib/notification';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div 
            className="bg-zinc-900 border border-zinc-700 rounded-[var(--pos-radius-lg)] w-full max-w-md flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
              <h2 className="text-xl font-bold">{title}</h2>
              {onClose && (
                <button 
                  onClick={() => { playNotificationSound.tap(); onClose(); }} 
                  className="text-[var(--pos-text-muted)] hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {children}
            </div>
            
            {footer && (
              <div className="p-6 border-t border-white/10 bg-black/40 rounded-b-[var(--pos-radius-lg)] flex justify-end gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
