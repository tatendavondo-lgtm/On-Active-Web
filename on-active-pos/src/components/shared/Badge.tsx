import type { ReactNode } from 'react';
import { cn } from './Button';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'salesman' | 'walkin' | 'online-collect' | 'online-deliver';
  children: ReactNode;
  className?: string;
}

export function Badge({ variant = 'info', children, className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
    variant === 'success' && 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20',
    variant === 'warning' && 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    variant === 'error' && 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20',
    variant === 'info' && 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20',
    variant === 'salesman' && 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20',
    variant === 'walkin' && 'bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20',
    variant === 'online-collect' && 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    variant === 'online-deliver' && 'bg-[#EC4899]/10 text-[#EC4899] border-[#EC4899]/20',
    className
    )}>
      {children}
    </span>
  );
}
