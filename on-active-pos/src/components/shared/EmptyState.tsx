import { ShoppingBag, PackageSearch, Inbox, History } from 'lucide-react';

interface EmptyStateProps {
  icon: 'cart' | 'products' | 'orders' | 'history';
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'cart': return <ShoppingBag className="w-12 h-12 text-[var(--pos-text-muted)]" />;
      case 'products': return <PackageSearch className="w-12 h-12 text-[var(--pos-text-muted)]" />;
      case 'orders': return <Inbox className="w-12 h-12 text-[var(--pos-text-muted)]" />;
      case 'history': return <History className="w-12 h-12 text-[var(--pos-text-muted)]" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-fade-in">
      <div className="bg-[var(--pos-surface)] p-6 rounded-full border border-[var(--pos-border)] mb-2 shadow-inner">
        {getIcon()}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-[var(--pos-text-secondary)] max-w-xs mx-auto">{message}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
