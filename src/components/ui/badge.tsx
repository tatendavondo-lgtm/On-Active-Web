import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
}

export function Badge({
  children,
  variant = 'default',
  className = '',
  ...props
}: BadgeProps) {
  const base =
    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors border';
  const variants: Record<string, string> = {
    default: 'bg-[#C5A021]/15 text-[#C5A021] border-[#C5A021]/30',
    outline: 'bg-transparent text-white border-white/20',
    secondary: 'bg-[#1a1a1a] text-[#aaa] border-[#2a2a2a]',
    destructive: 'bg-red-950/40 text-red-400 border-red-900/50',
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`} {...props}>
      {children}
    </span>
  );
}
