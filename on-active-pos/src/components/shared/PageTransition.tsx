import type { ReactNode } from 'react';

export function PageTransition({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`h-full w-full ${className}`}>
      {children}
    </div>
  );
}
