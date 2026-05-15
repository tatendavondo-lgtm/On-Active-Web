import { NavLink } from 'react-router-dom';
import { MonitorSmartphone, PackageOpen, Globe, Users, BarChart2, Settings, LogOut } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { cn } from '../shared/Button';
import { useNotificationStore } from '../../stores/notificationStore';

export function TillSidebar() {
  const logout = useSessionStore(s => s.logout);
  const notifications = useNotificationStore(s => s.notifications);
  
  const onlineUnread = notifications.filter(n => n.type === 'online_order' && !n.read).length;
  const incomingUnread = notifications.filter(n => n.type === 'incoming_order' && !n.read).length;

  const links = [
    { to: '/till', icon: MonitorSmartphone, label: 'Register', end: true },
    { to: '/till/orders', icon: PackageOpen, label: 'Orders' },
    { to: '/till/online-orders', icon: Globe, label: 'Online Orders' },
    { to: '/till/customers', icon: Users, label: 'Customers' },
    { to: '/till/end-of-day', icon: BarChart2, label: 'End of Day' },
    { to: '/till/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-[var(--pos-sidebar-width)] bg-[var(--pos-surface-elevated)] border-r border-[var(--pos-border)] flex flex-col items-center py-6 gap-8">
      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-black text-xl tracking-tighter">
        OA
      </div>

      <nav className="flex-1 flex flex-col w-full gap-2 px-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center p-3 rounded-[var(--pos-radius)] text-[var(--pos-text-muted)] hover:text-white hover:bg-[var(--pos-surface-hover)] transition-all relative group",
              isActive && "text-[var(--pos-accent)] bg-[var(--pos-surface-hover)]"
            )}
            title={link.label}
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--pos-accent)] rounded-r-full" />}
                <link.icon className="w-6 h-6" />
                {link.to === '/till/online-orders' && onlineUnread > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-pink-500 text-[10px] text-white flex items-center justify-center rounded-full font-bold border border-[var(--pos-surface-elevated)]">
                    {onlineUnread}
                  </span>
                )}
                {link.to === '/till' && incomingUnread > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-purple-500 text-[10px] text-white flex items-center justify-center rounded-full font-bold border border-[var(--pos-surface-elevated)]">
                    {incomingUnread}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="p-3 text-[var(--pos-text-muted)] hover:text-[var(--pos-error)] hover:bg-[var(--pos-surface-hover)] rounded-[var(--pos-radius)] transition-colors"
        title="Logout"
      >
        <LogOut className="w-6 h-6" />
      </button>
    </aside>
  );
}
