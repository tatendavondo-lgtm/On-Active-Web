import { cn } from './Button';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-[var(--pos-surface-hover)] rounded", className)} />
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-[var(--pos-surface)] rounded-[var(--pos-radius)] border border-[var(--pos-border)] p-4 space-y-4">
      <Skeleton className="w-full aspect-square rounded-[var(--pos-radius)]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
