import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, ShoppingBag, Globe } from 'lucide-react';
import { useNotificationStore, type Notification } from '../../stores/notificationStore';
import { useNavigate } from 'react-router-dom';

export function ToastContainer() {
  const notifications = useNotificationStore((s) => s.notifications);
  
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.filter(n => !n.read).slice(0, 5).map((n) => (
        <Toast key={n.id} notification={n} />
      ))}
    </div>
  );
}

function Toast({ notification }: { notification: Notification }) {
  const [visible, setVisible] = useState(false);
  const markRead = useNotificationStore((s) => s.markRead);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    
    // Auto-dismiss common notifications after 4s, order notifications after 5s
    const isOrderNotif = notification.type === 'incoming_order' || notification.type === 'online_order';
    const duration = isOrderNotif ? 5000 : 4000;
    
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => markRead(notification.id), 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [notification, markRead]);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    setTimeout(() => markRead(notification.id), 300);
  };

  const handleClick = () => {
    if (notification.action) {
      navigate(notification.action.route);
    }
    handleClose({ stopPropagation: () => {} } as any);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'incoming_order': return <ShoppingBag className="w-5 h-5 text-purple-400" />;
      case 'online_order': return <Globe className="w-5 h-5 text-pink-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-emerald-500/20';
      case 'warning': return 'border-amber-500/20';
      case 'error': return 'border-red-500/20';
      case 'incoming_order': return 'border-purple-500/20';
      case 'online_order': return 'border-pink-500/20';
      default: return 'border-blue-500/20';
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        pointer-events-auto w-80 bg-[var(--pos-surface-elevated)] border ${getBorderColor()} rounded-[var(--pos-radius-lg)] shadow-2xl p-4
        transition-all duration-300 transform cursor-pointer
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
      `}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white mb-1 truncate">{notification.title}</h4>
          <p className="text-xs text-[var(--pos-text-secondary)] leading-relaxed">{notification.message}</p>
          {notification.action && (
            <button className="mt-2 text-xs font-bold text-[var(--pos-accent)] hover:underline">
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-white/5 text-[var(--pos-text-muted)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
