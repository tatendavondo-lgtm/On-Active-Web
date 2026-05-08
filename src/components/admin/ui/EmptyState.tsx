import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-14 h-14 bg-[#161616] border border-[#1f1f1f] rounded-[8px] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#2a2a2a]" />
      </div>
      <h3 className="text-white text-sm font-semibold mb-1.5">{title}</h3>
      {description && <p className="text-[#444] text-sm max-w-xs leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 bg-[#C5A021] text-black text-sm font-bold rounded-[6px] hover:bg-[#A6861C] transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
