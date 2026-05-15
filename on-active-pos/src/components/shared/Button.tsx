import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--pos-radius)] font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        {
          'bg-[var(--pos-accent)] text-black hover:opacity-90': variant === 'primary',
          'border border-[var(--pos-border)] bg-transparent hover:bg-[var(--pos-surface-hover)] text-white': variant === 'secondary',
          'bg-[var(--pos-error)] text-white hover:opacity-90': variant === 'danger',
          'bg-transparent hover:bg-[var(--pos-surface-hover)] text-[var(--pos-text-secondary)] hover:text-white': variant === 'ghost',
          'bg-[var(--pos-success)] text-white hover:opacity-90': variant === 'success',
          'h-10 px-4 text-sm': size === 'sm',
          'h-12 px-6 text-base': size === 'md',
          'h-14 px-8 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
