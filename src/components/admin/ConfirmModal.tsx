'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-[#111] border border-[#1f1f1f] rounded-[8px] w-full max-w-md p-6 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className={`w-10 h-10 rounded-[6px] flex items-center justify-center flex-shrink-0 ${
                    danger ? 'bg-red-500/12' : 'bg-amber-500/12'
                  }`}
                >
                  <AlertTriangle size={18} className={danger ? 'text-red-400' : 'text-amber-400'} />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{title}</h3>
                  <p className="text-[#555] text-sm mt-1 leading-relaxed">{message}</p>
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-sm text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors rounded-[6px]"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-bold rounded-[6px] transition-colors ${
                    danger
                      ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                      : 'bg-[#C5A021] text-black hover:bg-[#A6861C]'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
